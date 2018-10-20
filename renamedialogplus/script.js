var Addon_Id = "renamedialogplus";

var items = te.Data.Addons.getElementsByTagName(Addon_Id);
if (items.length) {
	var item = items[0];
	if (!item.getAttribute("Set")) {
		item.setAttribute("KeyExec", true);
		item.setAttribute("KeyOn", "List");
		item.setAttribute("Key", "F2");
		item.setAttribute("MouseOn", "List");
	}
}
if (window.Addon == 1) {
	Addons.RenameDialogPlus =
	{
		strName: "Rename Dialog Box...",
		Exec: function (Ctrl, pt)
		{
			var FV = GetFolderView(Ctrl, pt);
			if (FV) {
				var Focused = FV.FocusedItem;
				if (Focused && api.GetAttributesOf(Focused, SFGAO_CANRENAME)) {
					ShowDialog("../addons/renamedialogplus/dialog.html", { MainWindow: window, width: 480, height: 120, Focused: Focused });
					return S_OK;
				}
			}
		}
	};
	if (items.length) {
		var s = item.getAttribute("MenuName");
		if (s && s != "") {
			Addons.RenameDialogPlus.strName = GetText(s);
		}
		//Menu
		if (item.getAttribute("MenuExec")) {
			Addons.RenameDialogPlus.nPos = api.LowPart(item.getAttribute("MenuPos"));
			AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos, Selected, item)
			{
				if (item && item.IsFileSystem) {
					api.InsertMenu(hMenu, Addons.RenameDialogPlus.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Addons.RenameDialogPlus.strName);
					ExtraMenuCommand[nPos] = Addons.RenameDialogPlus.Exec;
				}
				return nPos;
			});
		}
		//Key
		if (item.getAttribute("KeyExec")) {
			SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.RenameDialogPlus.Exec, "Func");
		}
		//Mouse
		if (item.getAttribute("MouseExec")) {
			SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.RenameDialogPlus.Exec, "Func");
		}

		AddTypeEx("Add-ons", "Rename dialog plus...", Addons.RenameDialogPlus.Exec);
	}
} else if (window.Addon == 2) {
	AddEventEx(window, "load", function ()
	{
		ApplyLang(document);
		var Focused = dialogArguments.Focused;
		var s = api.GetDisplayNameOf(Focused, SHGDN_FOREDITING);
		document.getElementById("P").innerText = s;
		document.F.N.value = fso.GetBaseName(s);
		document.F.E.value = fso.GetExtensionName(s);
		document.F.N.select();
		document.F.N.focus();
	});

	AddEventEx(document.body, "keydown", function (e)
	{
		var key = (e || event).keyCode;
		if (key == VK_RETURN) {
			DoRename();
		}
		if (key == VK_ESCAPE) {
			window.close();
		}
		return true;
	});

	DoRename = function ()
	{
		var Focused = dialogArguments.Focused;
		var s = api.GetAttributesOf(Focused, SFGAO_CANRENAME);
		var r = [document.F.N.value, document.F.E.value].join(".");
		if (r && s != r) {
			try {
				Focused.Name = r;
			} catch (e) {
				ShowError(e, api.LoadString(hShell32, 6020).replace("%1!ls!", "").replace("%2!ls!", s));
			}
		}
		window.close();
	}
}
