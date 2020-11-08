var Addon_Id = "renamedialogplus";

var item = await GetAddonElement(Addon_Id);
if (!await item.getAttribute("Set")) {
	item.setAttribute("KeyExec", true);
	item.setAttribute("KeyOn", "List");
	item.setAttribute("Key", "F2");
	item.setAttribute("MouseOn", "List");
}

if (window.Addon == 1) {
	Addons.RenameDialogPlus = {
		strName: await item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name,
		nPos: GetNum(await item.getAttribute("MenuPos")),

		Exec: async function (Ctrl, pt) {
			var FV = await GetFolderView(Ctrl, pt);
			if (FV) {
				var Focused = await FV.FocusedItem;
				if (Focused && await api.GetAttributesOf(Focused, SFGAO_CANRENAME)) {
					var opt = await api.CreateObject("Object");
					opt.MainWindow = $;
					opt.width = 480;
					opt.height = 120;
					opt.Focused = Focused;
					opt.ResultsFolder = await api.ILIsEqual(await FV.FolderItem.Alt, ssfRESULTSFOLDER);
					ShowDialog("../addons/renamedialogplus/dialog.html", opt);
					return S_OK;
				}
			}
		}
	};
	//Menu
	if (item.getAttribute("MenuExec")) {
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos, Selected, item) {
			if (item && item.IsFileSystem && api.GetAttributesOf(item, SFGAO_CANRENAME)) {
				api.InsertMenu(hMenu, Addons.RenameDialogPlus.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Addons.RenameDialogPlus.strName);
				ExtraMenuCommand[nPos] = Addons.RenameDialogPlus.Exec;
			}
			return nPos;
		});
	}
	//Key
	if (await item.getAttribute("KeyExec")) {
		SetKeyExec(await item.getAttribute("KeyOn"), await item.getAttribute("Key"), Addons.RenameDialogPlus.Exec, "Async");
	}
	//Mouse
	if (await item.getAttribute("MouseExec")) {
		SetGestureExec(await item.getAttribute("MouseOn"), await item.getAttribute("Mouse"), Addons.RenameDialogPlus.Exec, "Async");
	}

	AddTypeEx("Add-ons", "Rename dialog plus...", Addons.RenameDialogPlus.Exec);
}
