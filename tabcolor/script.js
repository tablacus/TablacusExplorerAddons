var item = GetAddonElement("tabcolor");
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
	Addons.TabColor = {
		db: {},
		nPos: 0,
		strName: "Change tab color...",

		Exec: function (Ctrl, pt)
		{
			var FV = GetFolderView(Ctrl, pt);
			if (FV) {
				Addons.TabColor.Set(FV, ChooseWebColor(RunEvent4("GetTabColor", FV)));
			}
			return S_OK;
		},

		Set: function (FV, s)
		{
			var path = api.GetDisplayNameOf(FV.FolderItem, SHGDN_FORPARSINGEX | SHGDN_FORPARSING);
			if (s) {
				Addons.TabColor.db[path] = s;
			} else {
				delete Addons.TabColor.db[path];
			}
			Addons.TabColor.db[true] = true;
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
			Addons.TabColor.db[xmlitems[i].getAttribute("Path")] = xmlitems[i].text;
		}
	}

	//Menu
	if (item.getAttribute("MenuExec")) {
		Addons.TabColor.nPos = api.LowPart(item.getAttribute("MenuPos"));
		var s = item.getAttribute("MenuName");
		if (s && s != "") {
			Addons.TabColor.strName = s;
		}
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
		{
			api.InsertMenu(hMenu, Addons.TabColor.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Addons.TabColor.strName));
			ExtraMenuCommand[nPos] = Addons.TabColor.Exec;
			return nPos;
		});
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.TabColor.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.TabColor.Exec, "Func");
	}

	AddEvent("GetTabColor", function (Ctrl)
	{
		return Addons.TabColor.db[api.GetDisplayNameOf(Ctrl.FolderItem, SHGDN_FORPARSING | SHGDN_FORPARSINGEX)];
	}, true);

	AddEvent("SaveConfig", function ()
	{
		if (Addons.TabColor.db[true]) {
			delete Addons.TabColor.db[true];
			var xml = CreateXml();
			var root = xml.createElement("TablacusExplorer");

			for (var path in Addons.TabColor.db) {
				var name = Addons.TabColor.db[path];
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

	AddTypeEx("Add-ons", Addons.TabColor.strName, Addons.TabColor.Exec);
}
