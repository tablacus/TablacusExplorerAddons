const Addon_Id = "tabname";
const item = GetAddonElement(Addon_Id);

Sync.TabName = {
	db: {},
	nPos: GetNum(item.getAttribute("MenuPos")),
	strName: item.getAttribute("MenuName") || GetText("Change tab name..."),

	Exec: function (Ctrl, pt) {
		const FV = GetFolderView(Ctrl, pt);
		if (FV) {
			const s = FV.Title;
			InputDialog(s, s, function (s) {
				if (s != null) {
					Sync.TabName.Set(FV, s);
				}
			});
		}
		return S_OK;
	},

	Set: function (FV, NewName) {
		const path = api.GetDisplayNameOf(FV, SHGDN_FORPARSING | SHGDN_FORPARSINGEX)
		if (NewName && NewName.length) {
			Sync.TabName.db[path] = NewName;
		} else {
			delete Sync.TabName.db[path];
			NewName = FV.FolderItem.Name;
		}
		FV.Title = NewName;
		Sync.TabName.db[true] = true;
	}
};
const xml = OpenXml("tabname.xml", true, false);
if (xml) {
	const items = xml.getElementsByTagName('Item');
	for (let i = items.length; i-- > 0;) {
		Sync.TabName.db[items[i].getAttribute("Path")] = items[i].text;
	}
}

//Menu
if (item.getAttribute("MenuExec")) {
	AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos) {
		api.InsertMenu(hMenu, Sync.TabName.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Sync.TabName.strName));
		ExtraMenuCommand[nPos] = Sync.TabName.Exec;
		return nPos;
	});
}
//Key
if (item.getAttribute("KeyExec")) {
	SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Sync.TabName.Exec, "Func");
}
//Mouse
if (item.getAttribute("MouseExec")) {
	SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Sync.TabName.Exec, "Func");
}

AddEvent("GetTabName", function (Ctrl) {
	return Sync.TabName.db[api.GetDisplayNameOf(Ctrl, SHGDN_FORPARSING | SHGDN_FORPARSINGEX)];
}, true);

AddEvent("SaveConfig", function () {
	if (Sync.TabName.db[true]) {
		delete Sync.TabName.db[true];
		const xml = CreateXml();
		const root = xml.createElement("TablacusExplorer");

		for (let path in Sync.TabName.db) {
			const name = Sync.TabName.db[path];
			if (path && name) {
				var item = xml.createElement("Item");
				item.setAttribute("Path", path);
				item.text = name;
				root.appendChild(item);
			}
		}
		xml.appendChild(root);
		SaveXmlEx("tabname.xml", xml, true);
	}
});

AddTypeEx("Add-ons", Sync.TabName.strName, Sync.TabName.Exec);
