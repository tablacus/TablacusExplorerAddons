Addons.ADSThumb = {
	FV: {},
	fStyle: LVIS_CUT | LVIS_SELECTED,

	Clear: function (Ctrl)
	{
		if (Ctrl.type <= CTRL_SB) {
			delete Addons.ADSThumb.FV[Ctrl.Id];
		}
	}
};

if (window.Addon == 1) {
	AddEvent("HandleIcon", function (Ctrl, pid)
	{
		if (Ctrl.IconSize > 32) {
			var db = Addons.ADSThumb.FV[Ctrl.Id];
			if (!db) {
				Addons.ADSThumb.FV[Ctrl.Id] = db = { "*": Ctrl.IconSize };
			}
			var path = pid.Path;
			if (db[path]) {
				return /object/i.test(typeof db[path]) ? true : undefined;
			}
			var image = te.WICBitmap().FromFile(path + ":thumbnail.jpg");
			if (image) {
				db[path] = GetThumbnail(image, Ctrl.IconSize * screen.logicalYDPI / 96, true);
				return true;
			}
			db[path] = 1;
		}
	}, true);

	AddEvent("ItemPostPaint", function (Ctrl, pid, nmcd, vcd)
	{
		var hList = Ctrl.hwndList;
		if (hList && Ctrl.IconSize > 32) {
			var db = Addons.ADSThumb.FV[Ctrl.Id];
			if (db) {
				var image = db[pid.Path];
				if (/object/i.test(typeof image)) {
					var cl, fStyle, rc = api.Memory("RECT");
					rc.Left = LVIR_ICON;
					api.SendMessage(hList, LVM_GETITEMRECT, nmcd.dwItemSpec, rc);
					var state = api.SendMessage(hList, LVM_GETITEMSTATE, nmcd.dwItemSpec, Addons.ADSThumb.fStyle);
					if (state == LVIS_SELECTED) {
						cl = CLR_DEFAULT;
						fStyle = api.GetFocus() == hList ? ILD_SELECTED : ILD_FOCUS;
					} else {
						cl = CLR_NONE;
						fStyle = (state & LVIS_CUT) || api.GetAttributesOf(pid, SFGAO_HIDDEN) ? ILD_SELECTED : ILD_NORMAL;
					}
					var x = Ctrl.IconSize * screen.logicalYDPI / 96;
					if (Ctrl.CurrentViewMode == FVM_DETAILS) {
						var i = api.SendMessage(hList, LVM_GETCOLUMNWIDTH, 0, 0);
						if (x > i) {
							x = i;
							rc.Right = rc.Left + i;
						}
					}
					var image = GetThumbnail(image, x, true);
					if (image) {
						image.DrawEx(nmcd.hdc, rc.Left + (rc.Right - rc.Left - image.GetWidth()) / 2, rc.Bottom - image.GetHeight(), 0, 0, cl, cl, fStyle);
						return S_OK;
					}
				}
			}
		}
	}, true);

	AddEvent("NavigateComplete", Addons.ADSThumb.Clear);

	AddEvent("Command", Addons.ADSThumb.Clear);

	AddEvent("IconSizeChanged", function (Ctrl)
	{
		var db = Addons.ADSThumb.FV[Ctrl.Id];
		if (db) {
			if (db["*"] < Ctrl.IconSize) {
				Addons.ADSThumb.Clear(Ctrl);
			}
		}
	});

	if (api.IsAppThemed() && WINVER >= 0x600) {
		AddEvent("Load", function ()
		{
			if (!Addons.ClassicStyle) {
				Addons.ADSThumb.fStyle = LVIS_CUT;
			}
		});
	}
}