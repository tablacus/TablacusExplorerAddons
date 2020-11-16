var Addon_Id = "tabcolor";
var item = GetAddonElement(Addon_Id);

Sync.TabColor = {
	db: {},
	nPos: 0,
	strName: "Change tab color...",

	Exec: function (Ctrl, pt) {
		var FV = GetFolderView(Ctrl, pt);
		if (FV) {
			Sync.TabColor.Set(FV, ChooseWebColor(RunEvent4("GetTabColor", FV)));
		}
		return S_OK;
	},

	Set: function (FV, s) {
		var path = api.GetDisplayNameOf(FV.FolderItem, SHGDN_FORPARSINGEX | SHGDN_FORPARSING);
		if (s) {
			Sync.TabColor.db[path] = s;
		} else {
			delete Sync.TabColor.db[path];
		}
		Sync.TabColor.db[true] = true;
		var cTC = te.Ctrls(CTRL_TC);
		for (var i in cTC) {
			if (cTC[i].Visible) {
				RunEvent3("SelectionChanged", cTC[i]);
			}
		}
		return S_OK;
	}
};
var xml = OpenXml("tabcolor.xml", true, false);
if (xml) {
	var xmlitems = xml.getElementsByTagName('Item');
	for (i = xmlitems.length; i-- > 0;) {
		Sync.TabColor.db[xmlitems[i].getAttribute("Path")] = xmlitems[i].text;
	}
}

//Menu
if (item.getAttribute("MenuExec")) {
	Sync.TabColor.nPos = api.LowPart(item.getAttribute("MenuPos"));
	var s = item.getAttribute("MenuName");
	if (s && s != "") {
		Sync.TabColor.strName = s;
	}
	AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos) {
		api.InsertMenu(hMenu, Sync.TabColor.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Sync.TabColor.strName));
		ExtraMenuCommand[nPos] = Sync.TabColor.Exec;
		return nPos;
	});
}
//Key
if (item.getAttribute("KeyExec")) {
	SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Sync.TabColor.Exec, "Func");
}
//Mouse
if (item.getAttribute("MouseExec")) {
	SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Sync.TabColor.Exec, "Func");
}

AddEvent("GetTabColor", function (Ctrl) {
	return Sync.TabColor.db[api.GetDisplayNameOf(Ctrl.FolderItem, SHGDN_FORPARSING | SHGDN_FORPARSINGEX)];
}, true);

AddEvent("SaveConfig", function () {
	if (Sync.TabColor.db[true]) {
		delete Sync.TabColor.db[true];
		var xml = CreateXml();
		var root = xml.createElement("TablacusExplorer");

		for (var path in Sync.TabColor.db) {
			var name = Sync.TabColor.db[path];
			if (path && name) {
				var item = xml.createElement("Item");
				item.setAttribute("Path", path);
				item.text = name;
				root.appendChild(item);
			}
		}
		xml.appendChild(root);
		SaveXmlEx("tabcolor.xml", xml, true);
	}
});

AddTypeEx("Add-ons", "Change tab color...", Sync.TabColor.Exec);
