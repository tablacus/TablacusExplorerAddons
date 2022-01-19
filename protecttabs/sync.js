const Addon_Id = "protecttabs";
const item = GetAddonElement(Addon_Id);

Sync.ProtectTabs = {
	strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
	nPos: GetNum(item.getAttribute("MenuPos")),

	Exec: function (Ctrl, pt) {
		const FV = GetFolderView(Ctrl, pt);
		if (FV) {
			FV.Data.Protect = !FV.Data.Protect;
			RunEvent1("Lock", FV.Parent, FV.Index, FV.Data.Lock);
		}
	}
};

AddEvent("CanClose", function (Ctrl) {
	if (Ctrl.type == CTRL_SB || Ctrl.type == CTRL_EB) {
		if (Ctrl.Data.Protect) {
			return S_FALSE;
		}
	}
});

AddEvent("SaveFV", function (FV, item) {
	if (FV.Data.Protect) {
		item.setAttribute("Protect", true);
	}
});

AddEvent("LoadFV", function (FV, item) {
	FV.Data.Protect = item.getAttribute("Protect");
});

//Menu
if (item.getAttribute("MenuExec")) {
	AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos, Selected, SelItem, ContextMenu, Name, pt) {
		var FV = GetFolderView(Ctrl, pt);
		api.InsertMenu(hMenu, Sync.ProtectTabs.nPos, MF_BYPOSITION | MF_STRING | (FV && FV.Data.Protect ? MF_CHECKED : 0), ++nPos, GetText(Sync.ProtectTabs.strName));
		ExtraMenuCommand[nPos] = Sync.ProtectTabs.Exec;
		return nPos;
	});
}
//Key
if (item.getAttribute("KeyExec")) {
	SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Sync.ProtectTabs.Exec, "Func");
}
//Mouse
if (item.getAttribute("MouseExec")) {
	SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Sync.ProtectTabs.Exec, "Func");
}
AddTypeEx("Add-ons", "Protect tabs", Sync.ProtectTabs.Exec);
