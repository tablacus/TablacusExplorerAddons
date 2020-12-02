const Addon_Id = "gohome";
const item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "Tabs");
	item.setAttribute("MenuPos", -1);

	item.setAttribute("KeyOn", "All");
	item.setAttribute("Key", "$4147");

	item.setAttribute("MouseOn", "List");
	item.setAttribute("Mouse", "");
}

Sync.GoHome = {
	nPos: GetNum(item.getAttribute("MenuPos")),
	strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
	strKey: item.getAttribute("KeyOn") ? GetKeyName(item.getAttribute("Key")) : "",

	Exec: function (Ctrl, pt) {
		const FV = GetFolderView(Ctrl, pt);
		if (FV && FV.Data.Home != null) {
			NavigateFV(FV, FV.Data.Home, GetNavigateFlags());
		}
		return S_OK;
	},

};
//Menu
if (item.getAttribute("MenuExec")) {
	AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos, Selected, SelItem, ContextMenu, Name, pt) {
		const FV = GetFolderView(Ctrl, pt);
		api.InsertMenu(hMenu, Sync.GoHome.nPos, MF_BYPOSITION | MF_STRING | (FV && FV.Data.Home ? 0 : MF_DISABLED), ++nPos, [GetText(Sync.GoHome.strName), Sync.GoHome.strKey].join("\t"));
		ExtraMenuCommand[nPos] = Sync.GoHome.Exec;
		return nPos;
	});
}
//Key
if (item.getAttribute("KeyExec")) {
	SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Sync.GoHome.Exec, "Func");
}
//Mouse
if (item.getAttribute("MouseExec")) {
	SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Sync.GoHome.Exec, "Func");
}

AddTypeEx("Add-ons", "Go home", Sync.GoHome.Exec);
