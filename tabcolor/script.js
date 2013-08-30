var Addon_Id = "tabcolor";

(function () {
	var items = te.Data.Addons.getElementsByTagName(Addon_Id);
	if (items.length) {
		var item = items[0];
		if (!item.getAttribute("Set")) {
			item.setAttribute("MenuExec", 1);
			item.setAttribute("Menu", "Tabs");
			item.setAttribute("MenuPos", 0);
			item.setAttribute("MenuName", "Coloring the Tab...");

			item.setAttribute("KeyOn", "List");
			item.setAttribute("Key", "");

			item.setAttribute("MouseOn", "List");
			item.setAttribute("Mouse", "");
		}
	}
	if (window.Addon == 1) {
		Addons.TabColor = {
			db: {},
			nPos: 0,
			strName: "Coloring the Tab...",

			Exec: function (Ctrl, pt)
			{
				var FV = GetFolderView(Ctrl, pt);
				if (FV) {
					var path = api.GetDisplayNameOf(FV.FolderItem, SHGDN_FORPARSINGEX | SHGDN_FORPARSING);
					s = ChooseWebColor(Addons.TabColor.db[path]);
					if (s) {
						Addons.TabColor.db[path] = s;
					}
					else {
						delete Addons.TabColor.db[path];
					}
					Addons.TabColor.db[true] = true;
					ChangeView(FV);
				}
			}
		};
		var xml = OpenXml("tabcolor.xml", true, false);
		if (xml) {
			var items = xml.getElementsByTagName('Item');
			for (i = items.length - 1; i >= 0; i--) {
				Addons.TabColor.db[items[i].getAttribute("Path")] = items[i].text;
			}
		}

		if (items.length) {
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
				SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), "Addons.TabColor.Exec(Ctrl, pt);", "JScript");
			}
			//Mouse
			if (item.getAttribute("MouseExec")) {
				SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), "Addons.TabColor.Exec(Ctrl, pt);", "JScript");
			}
		}

		AddEvent("GetTabColor", function (Ctrl)
		{
			return Addons.TabColor.db[api.GetDisplayNameOf(Ctrl.FolderItem, SHGDN_FORPARSING | SHGDN_FORPARSINGEX)];
		}, true);

		AddEvent("Finalize", function ()
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
})();
