if (window.Addon == 1) {
	Addons.NonexistentOverlay = {};
	var src = ExtractMacro(te, api.PathUnquoteSpaces(GetAddonOption("nonexistentoverlay", "Icon")));
	var image = src ? te.WICBitmap().FromFile(src): null;
	Addons.NonexistentOverlay.Icon = image || MakeImgData('icon:shell32.dll,131', 0, 32);

	AddEvent("ItemPostPaint2", function (Ctrl, pid, nmcd, vcd)
	{
		var hList = Ctrl.hwndList;
		if (hList) {
			if (pid.ExtendedProperty("Access") == undefined && pid.ExtendedProperty("Write") == undefined && pid.ExtendedProperty("Size") == 0) {
				var rc = api.Memory("RECT");
				rc.Left = LVIR_ICON;
				api.SendMessage(hList, LVM_GETITEMRECT, nmcd.dwItemSpec, rc);
				var image = Addons.NonexistentOverlay.Icon;
				var w = image.GetWidth();
				var h = image.GetHeight();
				var i = (rc.Bottom - rc.Top) / 2;
				var f = false;
				if (h > i) {
					w = w * i / h;
					h = i;
					f = true;
				}
				i = rc.Right - rc.Left / 2;
				if (w > i) {
					h = h * i / w;
					w = i;
					f = true;
				}
				if (f) {
					image = image.GetThumbnailImage(w, h);
				}
				if (image) {
					image.DrawEx(nmcd.hdc, rc.Left + ((rc.Right - rc.Left) - Ctrl.IconSize * screen.logicalYDPI / 96) / 2, rc.Bottom - h, w, h, CLR_NONE, CLR_NONE, ILD_NORMAL);
				}
			}
		}
	});
}
