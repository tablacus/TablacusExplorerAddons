var Addon_Id = "iconoverlay";

if (window.Addon == 1) {
	Addons.IconOverlay =
	{
		DLL: api.DllGetClassObject(fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), ["addons\\iconoverlay\\ticonoverlay", api.sizeof("HANDLE") * 8, ".dll"].join("")), "{ADB2CB70-5C00-4fa2-B121-CB60B556FFA7}"),
		Icon: [],
		db: {},

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
				Addons.IconOverlay.db = {};
			});
			AddEvent("ItemPostPaint2", function (Ctrl, pid, nmcd, vcd)
			{
				if (pid && Addons.IconOverlay.DLL) {
					if (!Addons.IconOverlay.db) {
						Addons.IconOverlay.db = {};
					}
					var i = Addons.IconOverlay.db[pid.Path];
					if (isNaN(i)) {
						i = Addons.IconOverlay.DLL.GetOverlayIconIndex(pid.Path, api.GetAttributesOf(pid, SFGAO_STORAGECAPMASK));
						Addons.IconOverlay.db[pid.Path] = i;
					}
					var icon = Addons.IconOverlay.Icon[i];
					if (icon) {
						rc = api.Memory("RECT");
						var hList = Ctrl.hwndList;
						if (hList) {
							var image = icon[Ctrl.IconSize < 32 ? 0 : 1];
							rc.Left = LVIR_ICON;
							api.SendMessage(hList, LVM_GETITEMRECT, nmcd.dwItemSpec, rc);
							var w = Ctrl.IconSize * screen.logicalYDPI / 96;
							image = GetThumbnail(image, Ctrl.IconSize < 32 ? w : (w * 5 / 16) + 16);
							var x = api.SendMessage(hList, LVM_GETVIEW, 0, 0) == 2 ? rc.Right - w : rc.Left + (rc.Right - rc.Left - w) / 2;
							var y = rc.Bottom - image.GetHeight() - 2;
							if (image) {
								image.DrawEx(nmcd.hdc, x, y, 0, 0, CLR_NONE, CLR_NONE, ILD_NORMAL);
							}
						} else {
							var hTree = Ctrl.hwndTree;
							if (hTree) {
								var image = icon[0];
								rc.Left = nmcd.dwItemSpec
								api.SendMessage(hTree, TVM_GETITEMRECT, true, rc);
							}
							if (image) {
								image.DrawEx(nmcd.hdc, rc.Left - 19 * screen.logicalXDPI / 96, rc.Top + 2 * screen.logicalYDPI / 96, 0, 0, CLR_NONE, CLR_NONE, ILD_NORMAL);
							}
						}
					}
				}
			});
		}
	}
} else {
	SetTabContents(0, "General", '<label>Base</label><br /><input type="text" id="Base" placeholder="11" style="width: 100%" />');
}