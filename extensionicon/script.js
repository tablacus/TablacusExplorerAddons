Addons.ExtensionIcon = {
	Icon: {},
	fStyle: LVIS_CUT | LVIS_SELECTED,

	GetIconImage: function (fn, Large)
	{
		fn = api.PathUnquoteSpaces(ExtractMacro(te, fn));
		return te.WICBitmap().FromFile(fn) || MakeImgData(fn, 0, Large ? 48 : 16);
	}
};

if (window.Addon == 1) {
	AddEvent("HandleIcon", function (Ctrl, pid)
	{
		if (Ctrl.hwndList) {
			var i = Ctrl.IconSize < 32 ? 0 : 1, db = Addons.ExtensionIcon.Icon[fso.GetExtensionName(api.GetDisplayNameOf(pid, SHGDN_FORPARSING)).toLowerCase()];
			if (db) {
				var image = db[i];
				if (image) {
					if (/string/i.test(typeof image)) {
						var image = Addons.ExtensionIcon.GetIconImage(image, i);
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
	});

	AddEvent("ItemPostPaint", function (Ctrl, pid, nmcd, vcd)
	{
		var hList = Ctrl.hwndList;
		if (hList) {
			var db = Addons.ExtensionIcon.Icon[fso.GetExtensionName(api.GetDisplayNameOf(pid, SHGDN_FORPARSING)).toLowerCase()];
			if (db) {
				var image = db[Ctrl.IconSize < 32 ? 0 : 1];
				if (/object/i.test(typeof image)) {
					var cl, fStyle, rc = api.Memory("RECT");
					rc.Left = LVIR_ICON;
					api.SendMessage(hList, LVM_GETITEMRECT, nmcd.dwItemSpec, rc);
					var state = api.SendMessage(hList, LVM_GETITEMSTATE, nmcd.dwItemSpec, Addons.ExtensionIcon.fStyle);
					if (state == LVIS_SELECTED) {
						cl = CLR_DEFAULT;
						fStyle = api.GetFocus() == hList ? ILD_SELECTED : ILD_FOCUS;
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
	});

	try {
		var ado = OpenAdodbFromTextFile(fso.BuildPath(te.Data.DataFolder, "config\\extensionicon.tsv"));
		while (!ado.EOS) {
			var ar = ado.ReadText(adReadLine).split("\t");
			if (ar[0]) {
				var a2 = ar[0].toLowerCase().split(/[^\w_!~#$%&\(\)]/);
				for (var i in a2) {
					if (a2[i]) {
						var db = {};
						Addons.ExtensionIcon.Icon[a2[i]] = db;
						for (var j = 2; j--;) {
							if (ar[j + 1]) {
								db[j] = ar[j + 1];
							}
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
				Addons.ExtensionIcon.fStyle = LVIS_CUT;
			}
		});
	}
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
