const Addon_Id = "fixedtabname";
const item = GetAddonElement(Addon_Id);

Sync.FixedTabName = {
	nPos: GetNum(item.getAttribute("MenuPos")),
	sName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name + "...",

	Exec: function (Ctrl, pt) {
		const FV = GetFolderView(Ctrl, pt);
		if (FV) {
			const s = Sync.FixedTabName.Get(FV) || GetText("Tabs");
			InputDialog(s, s, function (s) {
				if (s != null) {
					Sync.FixedTabName.Set(FV, s);
				}
			});
		}
		return S_OK;
	},

	Get: function (FV) {
		return FV.Data.TabName;
	},

	Set: function (FV, NewName) {
		if (NewName && NewName.length) {
			FV.Data.TabName = NewName;
		} else {
			delete FV.Data.TabName;
			NewName = GetTabName(FV);
		}
		FV.Title = NewName;
	}
};

//Menu
if (item.getAttribute("MenuExec")) {
	AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos) {
		api.InsertMenu(hMenu, Sync.FixedTabName.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Sync.FixedTabName.sName));
		ExtraMenuCommand[nPos] = Sync.FixedTabName.Exec;
		return nPos;
	});
}
//Key
if (item.getAttribute("KeyExec")) {
	SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Sync.FixedTabName.Exec, "Func");
}
//Mouse
if (item.getAttribute("MouseExec")) {
	SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Sync.FixedTabName.Exec, "Func");
}

AddEvent("GetTabName", Sync.FixedTabName.Get, true);

AddEvent("SaveFV", function (FV, item) {
	if (FV.Data.TabName) {
		item.setAttribute("TabName", FV.Data.TabName);
	}
});

AddEvent("LoadFV", function (FV, item) {
	FV.Data.TabName = item.getAttribute("TabName");
});

AddTypeEx("Add-ons", "Fixed tab name", Sync.FixedTabName.Exec);
