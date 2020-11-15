AddEvent(Common.RecentlyClosedTabs.strMenu, function (Ctrl, hMenu, nPos, Selected, item) {
	if (Common.UndoCloseTab && Common.UndoCloseTab.db.length) {
		Common.RecentlyClosedTabs.nCommand = nPos + 1;
		var mii = api.Memory("MENUITEMINFO");
		mii.cbSize = mii.Size;
		mii.fMask = MIIM_STRING | MIIM_SUBMENU;
		mii.dwTypeData = Common.RecentlyClosedTabs.strName;
		mii.hSubMenu = Common.RecentlyClosedTabs.CreateMenu();
		api.InsertMenuItem(hMenu, Common.RecentlyClosedTabs.nPos, true, mii);
		AddEvent("MenuCommand", Common.RecentlyClosedTabs.MenuCommand);
		nPos += Common.UndoCloseTab.db.length;
	}
	return nPos;
});
