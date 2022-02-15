const Addon_Id = "sethome";
const item = GetAddonElement(Addon_Id);

Sync.SetHome = {
	nPos: GetNum(item.getAttribute("MenuPos")),
	strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,

	Exec: function (Ctrl, pt) {
		const FV = GetFolderView(Ctrl, pt);
		if (FV) {
			FV.Data.Home = FV.FolderItem;
		}
		return S_OK;
	},

};

AddEvent("SaveFV", function (FV, item) {
	if (FV.Data.Home !== void 0) {
		item.setAttribute("Home", GetSavePath(FV.Data.Home));
	}
});

AddEvent("LoadFV", function (FV, item) {
	const Home = item.getAttribute("Home");;
	if (Home) {
		FV.Data.Home = api.ILCreateFromPath(Home);
	}
});

//Menu
if (item.getAttribute("MenuExec")) {
	AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos) {
		api.InsertMenu(hMenu, Sync.SetHome.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Sync.SetHome.strName));
		ExtraMenuCommand[nPos] = Sync.SetHome.Exec;
		return nPos;
	});
}
//Key
if (item.getAttribute("KeyExec")) {
	SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Sync.SetHome.Exec, "Func");
}
//Mouse
if (item.getAttribute("MouseExec")) {
	SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Sync.SetHome.Exec, "Func");
}

AddTypeEx("Add-ons", "Set home", Sync.SetHome.Exec);
