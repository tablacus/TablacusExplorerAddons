var Addon_Id = "tabname";
var item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "Tabs");
	item.setAttribute("MenuPos", 0);

	item.setAttribute("KeyOn", "List");
	item.setAttribute("Key", "");

	item.setAttribute("MouseOn", "List");
	item.setAttribute("Mouse", "");
}

if (window.Addon == 1) {
	Addons.TabName =
	{
		db: {},
		nPos: 0,
		strName: "Change tab name...",

		Exec: function (Ctrl, pt)
		{
			var FV = GetFolderView(Ctrl, pt);
			if (FV) {
				var s = FV.Title;
				s = InputDialog(s, s);
				if (s !== null) {
					Addons.TabName.Set(FV, s);
				}
			}
			return S_OK;
		},

		Set: function (FV, NewName)
		{
			var path = api.GetDisplayNameOf(FV, SHGDN_FORPARSING | SHGDN_FORPARSINGEX);
			if (NewName && NewName.length) {
				Addons.TabName.db[path] = NewName;
			} else {
				delete Addons.TabName.db[path];
				NewName = FV.FolderItem.Name;
			}
			FV.Title = NewName;
			Addons.TabName.db[true] = true;
		}
	};
	var xml = OpenXml("tabname.xml", true, false);
	if (xml) {
		var items = xml.getElementsByTagName('Item');
		for (i = items.length; i-- > 0;) {
			Addons.TabName.db[items[i].getAttribute("Path")] = items[i].text;
		}
	}

	//Menu
	if (item.getAttribute("MenuExec")) {
		Addons.TabName.nPos = api.LowPart(item.getAttribute("MenuPos"));
		var s = item.getAttribute("MenuName");
		if (s && s != "") {
			Addons.TabName.strName = s;
		}
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
		{
			api.InsertMenu(hMenu, Addons.TabName.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Addons.TabName.strName));
			ExtraMenuCommand[nPos] = Addons.TabName.Exec;
			return nPos;
		});
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), "Addons.TabName.Exec();", "JScript");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), "Addons.TabName.Exec();", "JScript");
	}

	AddEvent("GetTabName", function (Ctrl)
	{
		return Addons.TabName.db[api.GetDisplayNameOf(Ctrl.FolderItem, SHGDN_FORPARSING | SHGDN_FORPARSINGEX)];
	}, true);

	AddEvent("SaveConfig", function ()
	{
		if (Addons.TabName.db[true]) {
			delete Addons.TabName.db[true];
			var xml = CreateXml();
			var root = xml.createElement("TablacusExplorer");

			for (var path in Addons.TabName.db) {
				var name = Addons.TabName.db[path];
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

	AddTypeEx("Add-ons", Addons.TabName.strName, Addons.TabName.Exec);
}