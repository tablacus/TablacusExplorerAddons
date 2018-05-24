var Addon_Id = "iconoverlay";

if (window.Addon == 1) {
	Addons.IconOverlay =
	{
		DLL: api.DllGetClassObject(fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), ["addons\\iconoverlay\\ticonoverlay", api.sizeof("HANDLE") * 8, ".dll"].join("")), "{ADB2CB70-5C00-4fa2-B121-CB60B556FFA7}"),
		Icon: [],

		Finalize: function ()
		{
			delete Addons.IconOverlay.DLL;
		}
	};

	AddEvent("AddonDisabled", function (Id)
	{
		if (Id.toLowerCase() == "iconoverlay") {
			Addons.IconOverlay.Finalize();
		}
	});

	AddEvent("ItemPostPaint2", function (Ctrl, pid, nmcd, vcd)
	{
		var hList = Ctrl.hwndList;
		if (hList && pid && Addons.IconOverlay.DLL) {
			var i = Addons.IconOverlay.DLL.GetOverlayIconIndex(pid.Path, 0);
			if (i >= 0) {
				var image = Addons.IconOverlay.Icon[i];
				if (image) {
					var rc = api.Memory("RECT");
					rc.Left = LVIR_ICON;
					api.SendMessage(hList, LVM_GETITEMRECT, nmcd.dwItemSpec, rc);
					var x, y, w = Ctrl.IconSize * screen.logicalYDPI / 96;
					image = GetThumbnail(image, w, Ctrl.IconSize >= 32);
					if (api.SendMessage(hList, LVM_GETVIEW, 0, 0)) {
						x = rc.Right - w + 1;
						y = rc.Bottom - w - 3;
					} else {
						x = rc.Left + (rc.Right - rc.Left - w) / 2;
						y = rc.Bottom - image.GetHeight() - 1;
					}
					if (image) {
						image.DrawEx(nmcd.hdc, x, y, 0, 0, CLR_NONE, CLR_NONE, ILD_NORMAL);
					}
				}
			}
		}
	});
	
	if (Addons.IconOverlay.DLL) {
		Addons.IconOverlay.DLL.init(GetAddonOption(Addon_Id, "Base") || 11);
		for (var i = 0, o = {}; Addons.IconOverlay.DLL.GetOverlayInfo(i, o) == S_OK; i++) {
			Addons.IconOverlay.Icon[i] = o.dwFlags == 1 ? api.CreateObject("WICBitmap").FromFile(o.IconFile) : MakeImgData("icon:" + o.IconFile + "," + o.Index, 0, 32);
		}
	}
} else {
	SetTabContents(0, "General", '<label>Base</label><br /><input type="text" id="Base" placeholder="11" style="width: 100%" />');
}