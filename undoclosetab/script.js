var Addon_Id = "undoclosetab";

(function () {
	var items = te.Data.Addons.getElementsByTagName(Addon_Id);
	if (items.length) {
		var item = items[0];
		if (!item.getAttribute("Set")) {
			item.setAttribute("MenuExec", 1);
			item.setAttribute("Menu", "Tabs");
			item.setAttribute("MenuPos", 0);
			item.setAttribute("MenuName", "&Undo Close Tab");

			item.setAttribute("KeyExec", 1);
			item.setAttribute("Key", "Shift+Ctrl+T");
			item.setAttribute("KeyOn", "All");

			item.setAttribute("MouseOn", "List");
		}
	}
	if (window.Addon == 1) {
		Addons.UndoCloseTab =
		{
			MAX: 100,
			db: [],

			Exec: function (Ctrl, pt)
			{
				var FV = GetFolderView(Ctrl, pt);
				if (FV) {
					Addons.UndoCloseTab.bLock = true;
					while (Addons.UndoCloseTab.db.length) {
						var s = Addons.UndoCloseTab.db.shift();
						if (typeof(s) == "string") {
							var a = s.split(/\n/);
							if (a.length > 1) {
								s = te.FolderItems(a.length - 1);
								s.Index = a.pop();
								for (i in a) {
									s.AddItem(a[i]);
								}
							}
						}
						Addons.UndoCloseTab.bFail = false;
						FV.Navigate(s, SBSP_NEWBROWSER);
						if (!Addons.UndoCloseTab.bFail) {
							break;
						}
					}
					Addons.UndoCloseTab.bLock = false;
				}
			}
		}

		var xml = OpenXml("closedtabs.xml", true, false);
		if (xml) {
			var items = xml.getElementsByTagName('Item');
			for (i = items.length - 1; i >= 0; i--) {
				Addons.UndoCloseTab.db.unshift(items[i].text);
			}
		}
		xml = null;

		AddEvent("CloseView", function (Ctrl)
		{
			if (Ctrl.FolderItem) {
				if (Addons.UndoCloseTab.bLock) {
					Addons.UndoCloseTab.bFail = true;
				}
				else {
					Addons.UndoCloseTab.db.unshift(Ctrl.History);
					Addons.UndoCloseTab.db.splice(Addons.UndoCloseTab.MAX, MAXINT);
				}
			}
			return S_OK;
		});

		AddEvent("SaveConfig", function ()
		{
			var xml = CreateXml();
			var root = xml.createElement("TablacusExplorer");

			var db = Addons.UndoCloseTab.db;
			while (db.length) {
				var item = xml.createElement("Item");
				var s = db.shift();
				if (typeof(s) != "string") {
					var a = [];
					for (var i in s) {
						a.push(api.GetDisplayNameOf(s[i], SHGDN_FORPARSING | SHGDN_FORPARSINGEX));
					}
					a.push(s.Index);
					s = a.join("\n");
				}
				item.text = s;
				root.appendChild(item);
				item = null;
			}
			xml.appendChild(root);
			SaveXmlEx("closedtabs.xml", xml, true);
			xml = null;
		});


		if (items.length) {
			var s = item.getAttribute("MenuName");
			if (s && s != "") {
				Addons.UndoCloseTab.strName = s;
			}
			//Menu
			if (item.getAttribute("MenuExec")) {
				Addons.UndoCloseTab.nPos = api.LowPart(item.getAttribute("MenuPos"));
				AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
				{
					api.InsertMenu(hMenu, Addons.UndoCloseTab.nPos, MF_BYPOSITION | MF_STRING | ((Addons.UndoCloseTab.db.length) ? MF_ENABLED : MF_DISABLED), ++nPos, GetText(Addons.UndoCloseTab.strName));
					ExtraMenuCommand[nPos] = Addons.UndoCloseTab.Exec;
					return nPos;
				});
			}
			//Key
			if (item.getAttribute("KeyExec")) {
				SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), "Addons.UndoCloseTab.Exec();", "JScript");
			}
			//Mouse
			if (item.getAttribute("MouseExec")) {
				SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), "Addons.UndoCloseTab.Exec();", "JScript");
			}

			AddTypeEx("Add-ons", "Undo Close Tab", Addons.UndoCloseTab.Exec);
		}
	}
})();
