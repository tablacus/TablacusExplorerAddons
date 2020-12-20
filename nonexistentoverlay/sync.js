if (window.Addon == 1) {
	Sync.NonexistentOverlay = {};
	const src = ExtractPath(te, GetAddonOption("nonexistentoverlay", "Icon"));
	const image = src ? api.CreateObject("WICBitmap").FromFile(src) : null;
	Sync.NonexistentOverlay.Icon = image || MakeImgData('icon:shell32.dll,131', 0, 32);

	AddEvent("ItemPostPaint2", function (Ctrl, pid, nmcd, vcd) {
		const hList = Ctrl.hwndList;
		if (hList) {
			if (pid.Size < 0 && pid.ExtendedProperty("Access") == null && pid.ExtendedProperty("Write") == null) {
				const rc = api.Memory("RECT");
				rc.left = LVIR_ICON;
				api.SendMessage(hList, LVM_GETITEMRECT, nmcd.dwItemSpec, rc);
				let image = Sync.NonexistentOverlay.Icon;
				let w = image.GetWidth();
				let h = image.GetHeight();
				let i = (rc.bottom - rc.top) / 2;
				let f = false;
				if (h > i) {
					w = w * i / h;
					h = i;
					f = true;
				}
				i = rc.right - rc.left / 2;
				if (w > i) {
					h = h * i / w;
					w = i;
					f = true;
				}
				if (f) {
					image = image.GetThumbnailImage(w, h);
				}
				if (image) {
					image.DrawEx(nmcd.hdc, rc.left + ((rc.right - rc.left) - Ctrl.IconSize * screen.deviceYDPI / 96) / 2, rc.bottom - h, w, h, CLR_NONE, CLR_NONE, ILD_NORMAL);
				}
			}
		}
	});
}
