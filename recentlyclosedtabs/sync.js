Sync.RecentlyClosedTabs = {
	CreateMenu: function () {
		const hMenu = api.CreatePopupMenu();
		const db = {};
		if (Sync.UndoCloseTab && Sync.UndoCloseTab.Get) {
			const seed = new Date().getTime();
			const nLen = Common.UndoCloseTab.db.length;
			for (let i = 0; i < nLen; i++) {
				const Items = Sync.UndoCloseTab.Get(i);
				let s = [seed];
				for (let j = Items.length; j--;) {
					s.unshift(PathQuoteSpaces(Items.Item(j).Path));
				}
				s = s.join(" ");
				const Item = Items.Item(Items.Index);
				if (Item && !db[s]) {
					db[s] = 1;
					const mii = api.Memory("MENUITEMINFO");
					mii.fMask = MIIM_STRING | MIIM_ID | MIIM_BITMAP;
					AddMenuIconFolderItem(mii, Item);
					s = Item.Path;
					const nCount = Items.Count;
					if (nCount > 1) {
						s += "...\t" + nCount;
					}
					mii.dwTypeData = s;
					mii.wId = i + Common.RecentlyClosedTabs.nCommand;
					api.InsertMenuItem(hMenu, MAXINT, true, mii);
				}
			}
		}
		return hMenu;
	},

	MenuCommand: function (Ctrl, pt, Name, nVerb, hMenu) {
		nVerb -= Common.RecentlyClosedTabs.nCommand;
		if (nVerb >= 0) {
			Sync.UndoCloseTab.Open(GetFolderView(Ctrl, pt), nVerb);
			return S_OK;
		}
	}
};

AddEvent(Common.RecentlyClosedTabs.strMenu, function (Ctrl, hMenu, nPos, Selected, item) {
	if (Common.UndoCloseTab && Common.UndoCloseTab.db.length) {
		Common.RecentlyClosedTabs.nCommand = nPos + 1;
		var mii = api.Memory("MENUITEMINFO");
		mii.cbSize = mii.Size;
		mii.fMask = MIIM_STRING | MIIM_SUBMENU;
		mii.dwTypeData = Common.RecentlyClosedTabs.strName;
		mii.hSubMenu = Sync.RecentlyClosedTabs.CreateMenu();
		api.InsertMenuItem(hMenu, Common.RecentlyClosedTabs.nPos, true, mii);
		AddEvent("MenuCommand", Sync.RecentlyClosedTabs.MenuCommand);
		nPos += Common.UndoCloseTab.db.length;
	}
	return nPos;
});
