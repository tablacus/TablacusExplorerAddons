var Addon_Id = "tabname";

if (window.Addon == 1) { (function () {
	g_tabname = {
		db: {},
		nPos: 0,
		strName: "Name the Tab...",

		Exec: function (Ctrl, pt)
		{
			var FV = GetFolderView(Ctrl, pt);
			if (FV) {
				var path = api.GetDisplayNameOf(FV.FolderItem, SHGDN_FORPARSINGEX | SHGDN_FORPARSING);
				var s = FV.Title;
				s = InputDialog(s, s);
				if (s !== null) {
					if (s.length) {
						g_tabname.db[path] = s;
					}
					else {
						delete g_tabname.db[path];
						s = FV.FolderItem.Name;
					}
					FV.Title = s;
					g_tabname.db[true] = true;
				}
			}
		}
	};
	var xml = OpenXml("tabname.xml", true, false);
	if (xml) {
		var items = xml.getElementsByTagName('Item');
		for (i = items.length - 1; i >= 0; i--) {
			g_tabname.db[items[i].getAttribute("Path")] = items[i].text;
		}
	}

	var items = te.Data.Addons.getElementsByTagName(Addon_Id);
	if (items.length) {
		var item = items[0];
		if (!item.getAttribute("Set")) {
			item.setAttribute("MenuExec", 1);
			item.setAttribute("Menu", "Tabs");
			item.setAttribute("MenuPos", 0);
			item.setAttribute("MenuName", g_tabname.strName);

			item.setAttribute("KeyOn", "List");
			item.setAttribute("Key", "");

			item.setAttribute("MouseOn", "List");
			item.setAttribute("Mouse", "");
		}
		//Menu
		if (item.getAttribute("MenuExec")) {
			g_tabname.nPos = api.LowPart(item.getAttribute("MenuPos"));
			var s = item.getAttribute("MenuName");
			if (s && s != "") {
				g_tabname.strName = s;
			}
			AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
			{
				api.InsertMenu(hMenu, g_tabname.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(g_tabname.strName));
				ExtraMenuCommand[nPos] = g_tabname.Exec;
				return nPos;
			});
		}
		//Key
		if (item.getAttribute("KeyExec")) {
			SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), "g_tabname.Exec();", "JScript");
		}
		//Mouse
		if (item.getAttribute("MouseExec")) {
			SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), "g_tabname.Exec();", "JScript");
		}
	}

	AddEvent("GetTabName", function (Ctrl)
	{
		return g_tabname.db[api.GetDisplayNameOf(Ctrl.FolderItem, SHGDN_FORPARSING | SHGDN_FORPARSINGEX)];
	}, true);

	AddEvent("Finalize", function ()
	{
		if (g_tabname.db[true]) {
			delete g_tabname.db[true];
			var xml = CreateXml();
			var root = xml.createElement("TablacusExplorer");

			for (var path in g_tabname.db) {
				var name = g_tabname.db[path];
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
})();}
