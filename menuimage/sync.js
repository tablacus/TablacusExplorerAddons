const Addon_Id = "menuimage";
const item = await GetAddonElement(Addon_Id);

Sync.MenuImage = {
	nPos: GetNum(item.getAttribute("MenuPos")),
	Size: 512,
};
//Menu
if (item.getAttribute("MenuExec")) {
	AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos, Selected, item) {
		for (let i = Selected ? Selected.Count : 0; i-- > 0;) {
			const item = Selected.Item(i);
			if (item && item.IsFileSystem) {
				const mii = api.Memory("MENUITEMINFO");
				mii.cbSize = mii.Size;
				mii.fMask = MIIM_ID | MIIM_BITMAP | MIIM_STRING | MIIM_SUBMENU;
				const image = api.CreateObject("WICBitmap").FromFile(item.Path);
				if (image) {
					const thum = GetThumbnail(image, Sync.MenuImage.Size, true);
					const hBM = thum.GetHBITMAP(api.GetSysColor(COLOR_MENU));
					if (hBM) {
						g_arBM.push(hBM);
						mii.hSubMenu = api.CreatePopupMenu();
						const mii2 = api.Memory("MENUITEMINFO");
						mii2.cbSize = mii.Size;
						mii2.fMask = MIIM_ID | MIIM_BITMAP;
						mii2.hbmpItem = hBM;
						api.InsertMenuItem(mii.hSubMenu, 0, true, mii2);

						mii.dwTypeData = item.Name;
						api.InsertMenuItem(hMenu, Sync.MenuImage.nPos, true, mii);
					}
				}
			}
		}
		return nPos;
	});
}
