var Addon_Id = "touchex";

(function () {
	var items = te.Data.Addons.getElementsByTagName(Addon_Id);
	if (items.length) {
		var item = items[0];
		if (!item.getAttribute("Set")) {
			item.setAttribute("MenuExec", 1);
			item.setAttribute("Menu", "Context");
			item.setAttribute("MenuPos", 1);
			item.setAttribute("MenuName", "Change the Time Stamp...");

			item.setAttribute("KeyOn", "List");
			item.setAttribute("MouseOn", "List");
		}
	}
	if (window.Addon == 1) {
		Addons.TouchEx =
		{
			Exec: function (Ctrl, pt)
			{
				var Selected = GetSelectedArray(Ctrl, pt, true).shift();
				if (Selected && Selected.Count) {
					try {
						Addons.TouchEx.Selected = Selected;
						var s = showModalDialog("../addons/touchex/dialog.html", window, "dialogWidth: 320px; dialogHeight: 280px; resizable: yes; status: 0");
						if (s) {
							s = s.split("#:-D`");
							for (var i = Selected.Count; i-- > 0;) {
								api.SetFileTime(Selected.Item(i), s[0], s[1], s[2]);
							}
						}
					}
					catch (e) {
						wsh.Popup(e.description + "\n" + s, 0, TITLE, MB_ICONEXCLAMATION);
					}
				}
			}
		}

		if (items.length) {
			var s = item.getAttribute("MenuName");
			if (s && s != "") {
				Addons.TouchEx.strName = GetText(s);
			}
			//Menu
			if (item.getAttribute("MenuExec")) {
				Addons.TouchEx.nPos = api.LowPart(item.getAttribute("MenuPos"));
				AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos, Selected, item)
				{
					if (item && item.IsFileSystem) {
						api.InsertMenu(hMenu, Addons.TouchEx.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Addons.TouchEx.strName);
						ExtraMenuCommand[nPos] = Addons.TouchEx.Exec;
					}
					return nPos;
				});
			}
			//Key
			if (item.getAttribute("KeyExec")) {
				SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.TouchEx.Exec, "Func");
			}
			//Mouse
			if (item.getAttribute("MouseExec")) {
				SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.TouchEx.Exec, "Func");
			}

			AddTypeEx("Add-ons", "Change the Time Stamp...", Addons.TouchEx.Exec);
		}
	}
	if (window.Addon == 2) {
		window.SetTimeStamp = function ()
		{
			returnValue = [document.F.Creation.value, document.F.LastAccess.value, document.F.LastWrite.value].join("#:-D`");
			window.close();
			return true;
		};

		window.vbFormatDateTime = function (s)
		{
			try {
				var vb = api.GetScriptDispatch('Function fn(s)\n fn = FormatDateTime(s)\nEnd Function', "VBScript");
				return vb.fn(s);
			}
			catch (e) {
				return Date(s).toLocaleString();
			}
		};

		document.onkeydown = function ()
		{
			if (event.keyCode == VK_RETURN) {
				SetTimeStamp();
			}
			return true;
		};

		AddEventEx(window, "load", function ()
		{
			ApplyLang(document);
			var item = dialogArguments.Addons.TouchEx.Selected.Item(0);
			var s = item.Path;
			var FindData = api.Memory("WIN32_FIND_DATA");
			var hFind = api.FindFirstFile(s, FindData);
			var n = dialogArguments.Addons.TouchEx.Selected.Count;
			document.getElementById("Path").innerHTML = (n > 1) ? s += " : " + n : s;
			if (hFind != INVALID_HANDLE_VALUE) {
				s = vbFormatDateTime(FindData.ftCreationTime);
				document.getElementById("lCreation").innerHTML = s;
				document.F.Creation.value = s;

				s = vbFormatDateTime(FindData.ftLastAccessTime);
				document.getElementById("lLastAccess").innerHTML = s;
				document.F.LastAccess.value = s;

				s = vbFormatDateTime(FindData.ftLastWriteTime);
				document.getElementById("lLastWrite").innerHTML = s;
				document.F.LastWrite.value = s;
			}
			api.FindClose(hFind);
		});
	}
})();
