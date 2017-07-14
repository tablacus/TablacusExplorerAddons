Addons.PathIcon = {
	Icon: {},
	fStyle: LVIS_CUT | LVIS_SELECTED,

	GetIconImage: function (fn, Large)
	{
		var image;
		fn = api.PathUnquoteSpaces(ExtractMacro(te, fn));
		if (/\.ico$|\*/i.test(fn)) {
			var sfi = api.Memory("SHFILEINFO");
			if (Large) {
				api.SHGetFileInfo(fn, 0, sfi, sfi.Size, SHGFI_SYSICONINDEX | SHGFI_USEFILEATTRIBUTES);
				sfi.hIcon = api.ImageList_GetIcon(te.Data.SHIL[SHIL_EXTRALARGE], sfi.iIcon, ILD_NORMAL);
			} else {
				api.SHGetFileInfo(fn, 0, sfi, sfi.Size, SHGFI_ICON | SHGFI_SMALLICON | SHGFI_USEFILEATTRIBUTES);
			}
			image = te.WICBitmap().FromHICON(sfi.hIcon);
			api.DestroyIcon(sfi.hIcon);
		} else {
			image = te.WICBitmap().FromFile(fn);
		}
		return image;
	}
};

if (window.Addon == 1) {
	AddEvent("HandleIcon", function (Ctrl, pid)
	{
		if (Ctrl.Type == CTRL_SB && pid) {
			var i = Ctrl.IconSize < 32 ? 0 : 1, db = Addons.PathIcon.Icon[pid.Path.toLowerCase()];
			if (db) {
				var image = db[i];
				if (image) {
					if (/string/i.test(typeof image)) {
						var image = Addons.PathIcon.GetIconImage(image, i);
						if (image) {
							db[i] = GetThumbnail(image, [32, 256][i] * screen.logicalYDPI / 96, true);
							return true;
						}
					} else {
						return true;
					}
				}
			}
		}
	}, true);

	AddEvent("ItemPostPaint", function (Ctrl, pid, nmcd, vcd)
	{
		if (Ctrl.Type == CTRL_SB && pid) {
			var db = Addons.PathIcon.Icon[pid.Path.toLowerCase()];
			if (db) {
				var image = db[Ctrl.IconSize < 32 ? 0 : 1];
				if (/object/i.test(typeof image)) {
					var cl, fStyle, rc = api.Memory("RECT");
					rc.Left = LVIR_ICON;
					api.SendMessage(Ctrl.hwndList, LVM_GETITEMRECT, nmcd.dwItemSpec, rc);
					var state = api.SendMessage(Ctrl.hwndList, LVM_GETITEMSTATE, nmcd.dwItemSpec, Addons.PathIcon.fStyle);
					if (state == LVIS_SELECTED) {
						cl = CLR_DEFAULT;
						fStyle = api.GetFocus() == Ctrl.hwndList ? ILD_SELECTED : ILD_FOCUS;
					} else {
						cl = CLR_NONE;
						fStyle = (state & LVIS_CUT) || api.GetAttributesOf(pid, SFGAO_HIDDEN) ? ILD_SELECTED : ILD_NORMAL;
					}
					image = GetThumbnail(image, Ctrl.IconSize * screen.logicalYDPI / 96, Ctrl.IconSize >= 32);
					image.DrawEx(nmcd.hdc, rc.Left + (rc.Right - rc.Left - image.GetWidth()) / 2, rc.Top + (rc.Bottom - rc.Top - image.GetHeight()) / 2, 0, 0, cl, cl, fStyle);
					return S_OK;
				}
			}
		}
	}, true);

	try {
		var ado = OpenAdodbFromTextFile(fso.BuildPath(te.Data.DataFolder, "config\\pathicon.tsv"));
		while (!ado.EOS) {
			var ar = ado.ReadText(adReadLine).split("\t");
			if (ar[0]) {
				var s = api.PathUnquoteSpaces(ExtractMacro(te, ar[0])).toLowerCase();
				if (s) {
					var db = {};
					Addons.PathIcon.Icon[s] = db;
					for (var j = 2; j--;) {
						if (ar[j + 1]) {
							db[j] = ar[j + 1];
						}
					}
				}
			}
		}
		ado.Close();
	} catch (e) {}

	if (api.IsAppThemed() && WINVER >= 0x600) {
		AddEvent("Load", function ()
		{
			if (!Addons.ClassicStyle) {
				Addons.PathIcon.fStyle = LVIS_CUT;
			}
		});
	}
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}