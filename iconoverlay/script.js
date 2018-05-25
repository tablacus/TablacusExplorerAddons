var Addon_Id = "iconoverlay";

if (window.Addon == 1) {
	Addons.IconOverlay =
	{
		DLL: api.DllGetClassObject(fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), ["addons\\iconoverlay\\ticonoverlay", api.sizeof("HANDLE") * 8, ".dll"].join("")), "{ADB2CB70-5C00-4fa2-B121-CB60B556FFA7}"),
		Icon: [],
		FV: {},

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

	if (Addons.IconOverlay.DLL) {
		Addons.IconOverlay.DLL.init(GetAddonOption(Addon_Id, "Base") || 11);
		for (var i = 0, o = {}; Addons.IconOverlay.DLL.GetOverlayInfo(i, o) == S_OK; i++) {
			Addons.IconOverlay.Icon[i] = [MakeImgData("icon:" + o.IconFile + (o.dwFlags == 1 ? "" : "," + o.Index), 0, 16), o.dwFlags == 1 ? api.CreateObject("WICBitmap").FromFile(o.IconFile) : MakeImgData("icon:" + o.IconFile + "," + o.Index, 0, 32)];
		}
		if (Addons.IconOverlay.Icon.length) {		
			AddEvent("ListViewCreated", function (Ctrl)
			{
				Addons.IconOverlay.FV[Ctrl.Id] = {};
			});
			AddEvent("ItemPostPaint2", function (Ctrl, pid, nmcd, vcd)
			{
				var hList = Ctrl.hwndList;
				if (hList && pid && Addons.IconOverlay.DLL) {
					var db = Addons.IconOverlay.FV[Ctrl.Id];
					if (!db) {
						db = {};
						Addons.IconOverlay.FV[Ctrl.Id] = db;
					}
					var i = db[pid.Path];
					if (isNaN(i)) {
						i = Addons.IconOverlay.DLL.GetOverlayIconIndex(pid.Path, api.GetAttributesOf(pid, SFGAO_STORAGECAPMASK));
						db[pid.Path] = i;
					}
					var icon = Addons.IconOverlay.Icon[i];
					if (icon) {
						var image = icon[Ctrl.IconSize < 32 ? 0 : 1];
						var rc = api.Memory("RECT");
						rc.Left = LVIR_ICON;
						api.SendMessage(hList, LVM_GETITEMRECT, nmcd.dwItemSpec, rc);
						var w = Ctrl.IconSize * screen.logicalYDPI / 96;
						image = GetThumbnail(image, Ctrl.IconSize < 32 ? w : (w * 5 / 16) + 16);
						var x = api.SendMessage(hList, LVM_GETVIEW, 0, 0) == 2 ? rc.Right - w : rc.Left + (rc.Right - rc.Left - w) / 2;
						var y = rc.Bottom - image.GetHeight() - 2;
						if (image) {
							image.DrawEx(nmcd.hdc, x, y, 0, 0, CLR_NONE, CLR_NONE, ILD_NORMAL);
						}
					}
				}
			});
		}
	}
} else {
	SetTabContents(0, "General", '<label>Base</label><br /><input type="text" id="Base" placeholder="11" style="width: 100%" />');
}