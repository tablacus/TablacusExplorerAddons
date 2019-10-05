var Addon_Id = "renamedialogplus";

var item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("KeyExec", true);
	item.setAttribute("KeyOn", "List");
	item.setAttribute("Key", "F2");
	item.setAttribute("MouseOn", "List");
}

if (window.Addon == 1) {
	Addons.RenameDialogPlus =
	{
		strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
		nPos: api.LowPart(item.getAttribute("MenuPos")),

		Exec: function (Ctrl, pt)
		{
			var FV = GetFolderView(Ctrl, pt);
			if (FV) {
				var Focused = FV.FocusedItem;
				if (Focused && api.GetAttributesOf(Focused, SFGAO_CANRENAME)) {
					ShowDialog("../addons/renamedialogplus/dialog.html", { MainWindow: window, width: 480, height: 120, Focused: Focused, 	ResultsFolder: api.ILIsEqual(FV.FolderItem.Alt, ssfRESULTSFOLDER) });
					return S_OK;
				}
			}
		}
	};
	//Menu
	if (item.getAttribute("MenuExec")) {
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos, Selected, item)
		{
			if (item && item.IsFileSystem && api.GetAttributesOf(item, SFGAO_CANRENAME)) {
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
} else if (window.Addon == 2) {
	AddEventEx(window, "load", function ()
	{
		MainWindow.RunEvent1("BrowserCreated", document);
		ApplyLang(document);
		var Focused = dialogArguments.Focused;
		var s = IsFileHideExt(Focused) && !dialogArguments.ResultsFolder ? fso.GetFileName(api.GetDisplayNameOf(Focused, SHGDN_FORPARSING)) : api.GetDisplayNameOf(Focused, SHGDN_FOREDITING);
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
		var s = document.getElementById("P").innerText;
		var r = document.F.E.value ? [document.F.N.value, document.F.E.value].join(".") : document.F.N.value;
		if (r && s != r) {
			if (/[\\\/:\*\?"<>\|]/.test(r)) {
				MessageBox(api.LoadString(hShell32, 4109), null, MB_ICONSTOP | MB_OK);
				return;
			}
			if (IsFileHideExt(Focused) && !dialogArguments.ResultsFolder) {
				if (api.SHFileOperation(FO_RENAME, api.GetDisplayNameOf(Focused, SHGDN_FORPARSING), r, FOF_ALLOWUNDO, false)) {
					return;
				}
			} else {
				try {
					Focused.Name = r;
				} catch (e) {
					MessageBox(api.LoadString(hShell32, 6020).replace("%1!ls!", api.sprintf(99, "0x%x", e.number)).replace("%2!ls!", s), null, MB_ICONSTOP | MB_OK);
					return;
				}
			}
		}
		window.close();
	}

	IsFileHideExt = function (Item)
	{
		return api.StrCmpI(fso.GetExtensionName(api.GetDisplayNameOf(Item, SHGDN_FOREDITING)), fso.GetExtensionName(api.GetDisplayNameOf(Item, SHGDN_FORPARSING))) && IsExists(api.GetDisplayNameOf(Item, SHGDN_FORPARSING));
	}
}
