Addons.FilterIcon = {
	FV: {},
	List: [['', 0, 0]],
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
			var db = Addons.FilterIcon.FV[Ctrl.Id];
			if (!db) {
				db = Addons.FilterIcon.FV[Ctrl.Id] = {};
			}
			var i = Ctrl.IconSize < 32 ? 1 : 2, list = Addons.FilterIcon.List;
			var path = api.GetDisplayNameOf(pid, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
			var j = db[path];
			if (isFinite(j)) {
				if (/object/i.test(typeof list[j][i])) {
					return true;
				}
				if (!/string/i.test(typeof list[j][i])) {
					return false;
				}
			}
			for (var j = 1; j < list.length; j++) {
				if (PathMatchEx(path, list[j][0])) {
					var image = list[j][i];
					if (image) {
						db[path] = j;
						if (/string/i.test(typeof image)) {
							var image = Addons.FilterIcon.GetIconImage(image, i);
							if (image) {
								list[j][i] = GetThumbnail(image, [0, 32, 256][i] * screen.logicalYDPI / 96, true);
								return true;
							} else {
								list[j][i] = 0;
							}
						}
					}
					return;
				}
			}
			db[path] = 0;
		}
	});

	AddEvent("ItemPostPaint", function (Ctrl, pid, nmcd, vcd)
	{
		var hList = Ctrl.hwndList;
		if (hList) {
			var i = Ctrl.IconSize < 32 ? 1 : 2, list = Addons.FilterIcon.List;
			var path = api.GetDisplayNameOf(pid, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
			var db = Addons.FilterIcon.FV[Ctrl.Id];
			var j = db && db[path];
			if (isFinite(j)) {
				var image = list[j][i];
				if (/object/i.test(typeof image)) {
					var cl, fStyle, rc = api.Memory("RECT");
					rc.Left = LVIR_ICON;
					api.SendMessage(hList, LVM_GETITEMRECT, nmcd.dwItemSpec, rc);
					var state = api.SendMessage(hList, LVM_GETITEMSTATE, nmcd.dwItemSpec, Addons.FilterIcon.fStyle);
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

	AddEvent("NavigateComplete", function (Ctrl)
	{
		Addons.FilterIcon.FV[Ctrl.Id] = {};
	});

	try {
		var ado = OpenAdodbFromTextFile(fso.BuildPath(te.Data.DataFolder, "config\\filtericon.tsv"));
		while (!ado.EOS) {
			var ar = ExtractMacro(te, ado.ReadText(adReadLine)).split("\t");
			if (ar[0]) {
				Addons.FilterIcon.List.push(ar);
			}
		}
		ado.Close();
	} catch (e) {}

	if (api.IsAppThemed() && WINVER >= 0x600) {
		AddEvent("Load", function ()
		{
			if (!Addons.ClassicStyle) {
				Addons.FilterIcon.fStyle = LVIS_CUT;
			}
		});
	}
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}