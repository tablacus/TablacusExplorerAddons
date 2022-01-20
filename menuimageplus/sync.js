Sync.MenuImagePlus = {
	Size: GetAddonOptionEx("menuimageplus", "Size") || 256,

	AddMenuItem: function (hMenu, mii, FolderItem, bSelect) {
		if (!mii.hSubMenu && !IsFolderEx(FolderItem)) {
			mii.hSubMenu = api.CreateMenu();
			api.InsertMenu(mii.hSubMenu, 0, MF_BYPOSITION | MF_STRING, 0, api.sprintf(99, '\tJScript\tSync.MenuImagePlus.OpenSubMenu("%llx",%d,"%llx",%d)', hMenu, mii.wID, mii.hSubMenu));
		}
	},

	OpenSubMenu: function (hMenu, wID, hSubMenu) {
		this.OpenMenu(api.sscanf(hSubMenu, "%llx"), FolderMenu.Items[wID - 1], api.sscanf(hMenu, "%llx"), wID);
	},

	OpenMenu: function (hMenu, FolderItem, hParent, wID) {
		let image = api.CreateObject("WICBitmap").FromFile(FolderItem);
		if (image) {
			if (image = GetThumbnail(image, Sync.MenuImagePlus.Size, true)) {
				const mii = api.Memory("MENUITEMINFO");
				mii.fMask = MIIM_ID | MIIM_BITMAP;
				mii.wID = wID;
				AddMenuImage(mii, image);
				api.InsertMenuItem(hMenu, 0, true, mii);
			}
		} else {
			RemoveSubMenu(hParent, wID);
		}
		api.DeleteMenu(hMenu, -2, MF_BYCOMMAND);
	}
};

AddEvent("FolderMenuAddMenuItem", Sync.MenuImagePlus.AddMenuItem);
