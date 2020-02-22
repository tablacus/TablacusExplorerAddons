if (window.Addon == 1) {
	Addons.MenuImagePlus = {
		Size: GetAddonOptionEx("menuimageplus", "Size") || 256,

		AddMenuItem: function (hMenu, mii, FolderItem, bSelect) {
			if (!mii.hSubMenu) {
				mii.hSubMenu = api.CreateMenu();
				api.InsertMenu(mii.hSubMenu, 0, MF_BYPOSITION | MF_STRING, 0, api.sprintf(99, '\tJScript\tAddons.MenuImagePlus.OpenSubMenu("%llx",%d,"%llx",%d)', hMenu, mii.wID, mii.hSubMenu));
			}
		},

		OpenSubMenu: function (hMenu, wID, hSubMenu) {
			this.OpenMenu(api.sscanf(hSubMenu, "%llx"), FolderMenu.Items[wID - 1], api.sscanf(hMenu, "%llx"), wID);
		},

		OpenMenu: function (hMenu, FolderItem, hParent, wID) {
			var mii = api.Memory("MENUITEMINFO");
			mii.cbSize = mii.Size;
			var image = api.CreateObject("WICBitmap").FromFile(FolderItem);
			if (image) {
				if (image = GetThumbnail(image, Addons.MenuImagePlus.Size, true)) {
					var hBM = image.GetHBITMAP(WINVER >= 0x600 ? -2 : GetSysColor(COLOR_MENU));
					if (hBM) {
						g_arBM.push(hBM);
						mii.fMask = MIIM_ID | MIIM_BITMAP;
						mii.hbmpItem = hBM;
						mii.wID = wID;
						api.InsertMenuItem(hMenu, 0, true, mii);
					}
				}
			}
			if (!hBM) {
				mii.fMask = MIIM_SUBMENU | MIIM_FTYPE;
				if (api.GetMenuItemInfo(hParent, wID, false, mii)) {
					mii.hSubMenu = 0;
					mii.fType &= ~MF_POPUP;
					api.SetMenuItemInfo(hParent, wID, false, mii);
				}
			}
		}
	};

	AddEvent("FolderMenuAddMenuItem", Addons.MenuImagePlus.AddMenuItem);
} else {
	var ado = OpenAdodbFromTextFile("addons\\" + Addon_Id + "\\options.html");
	if (ado) {
		SetTabContents(0, "", ado.ReadText(adReadAll));
		ado.Close();
	}
}
