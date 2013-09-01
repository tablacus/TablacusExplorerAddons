var Addon_Id = "dataurischeme";

(function () {
	var items = te.Data.Addons.getElementsByTagName(Addon_Id);
	if (items.length) {
		var item = items[0];
		if (!item.getAttribute("Set")) {
			item.setAttribute("MenuExec", 1);
			item.setAttribute("Menu", "Context");
			item.setAttribute("MenuPos", 1);
			item.setAttribute("MenuName", "Copy Data URI Scheme");

			item.setAttribute("KeyOn", "List");
			item.setAttribute("MouseOn", "List");
		}
	}
	if (window.Addon == 1) {
		Addons.DataURIScheme =
		{
			Exec: function (Ctrl, pt)
			{
				var Selected = GetSelectedArray(Ctrl, pt, true).shift();
				if (Selected && Selected.Count && !Selected.Item(0).IsFolder) {
					var path = Selected.Item(0).path;
					if (path) {
						var ct = "application/x-" + fso.GetExtensionName(path);
						try {
							ct = wsh.RegRead("HKCR\\." + fso.GetExtensionName(path) +"\\Content Type");
						} catch (e) {}
						try {
							var ado = te.CreateObject("Adodb.Stream");
							ado.Type = adTypeBinary;
							ado.Open();
							ado.LoadFromFile(Selected.Item(0).path);
							clipboardData.setData("text", "data:" + ct + ";base64," + api.base64_encode(ado.Read()).replace(/\s/g, ""));
							ado.Close();
						} catch (e) {
							wsh.Popup(e.description + "\n" + s, 0, TITLE, MB_ICONEXCLAMATION);
						}
					}
				}
			}
		}

		if (items.length) {
			var s = item.getAttribute("MenuName");
			if (s && s != "") {
				Addons.DataURIScheme.strName = GetText(s);
			}
			//Menu
			if (item.getAttribute("MenuExec")) {
				Addons.DataURIScheme.nPos = api.LowPart(item.getAttribute("MenuPos"));
				AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos, Selected, item)
				{
					if (item && item.IsFileSystem && !item.IsFolder) {
						api.InsertMenu(hMenu, Addons.DataURIScheme.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Addons.DataURIScheme.strName);
						ExtraMenuCommand[nPos] = Addons.DataURIScheme.Exec;
					}
					return nPos;
				});
			}
			//Key
			if (item.getAttribute("KeyExec")) {
				SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.DataURIScheme.Exec, "Func");
			}
			//Mouse
			if (item.getAttribute("MouseExec")) {
				SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.DataURIScheme.Exec, "Func");
			}

			AddTypeEx("Add-ons", "Copy Data URI Scheme", Addons.DataURIScheme.Exec);
		}
	}
})();
