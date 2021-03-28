const Addon_Id = "addtabs2fav";
const item = GetAddonElement(Addon_Id);

Sync.AddTabs2Fav = {
	strName: item.getAttribute("MenuName") || GetText("Add all tabs to favorites..."),
	nPos: GetNum(item.getAttribute("MenuPos")),

	Exec: function (Ctrl, pt) {
		GetFolderView(Ctrl, pt).Focus();
		const xml = te.Data.xmlMenus;
		const menus = xml.getElementsByTagName("Favorites");
		if (menus && menus.length) {
			const item = xml.createElement("Item");
			InputDialog(GetText("Name"), "", function (r) {
				if (r) {
					item.setAttribute("Name", r);
					item.setAttribute("Org", 1);
					item.setAttribute("Filter", "");
					const TC = te.Ctrl(CTRL_TC);
					const s = [];
					for (let i in TC) {
						s.push(api.GetDisplayNameOf(TC[i].FolderItem, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_FORPARSINGEX));
					}
					item.text = s.join("\n");
					item.setAttribute("Type", "Open in Background");
					menus[0].appendChild(item);
					SaveXmlEx("menus.xml", xml);
					FavoriteChanged();
				}
			});
		}
		return S_OK;
	}
};
//Menu
if (item.getAttribute("MenuExec")) {
	AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos) {
		api.InsertMenu(hMenu, Sync.AddTabs2Fav.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Sync.AddTabs2Fav.strName);
		ExtraMenuCommand[nPos] = Sync.AddTabs2Fav.Exec;
		return nPos;
	});
}
//Key
if (item.getAttribute("KeyExec")) {
	SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Sync.AddTabs2Fav.Exec, "Func");
}
//Mouse
if (item.getAttribute("MouseExec")) {
	SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Sync.AddTabs2Fav.Exec, "Func");
}

AddTypeEx("Add-ons", "Add all tabs to favorites...", Sync.AddTabs2Fav.Exec);
