const Addon_Id = "renamedialogplus";

const item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("KeyExec", true);
	item.setAttribute("KeyOn", "List");
	item.setAttribute("Key", "F2");
	item.setAttribute("MouseOn", "List");
}

if (window.Addon == 1) {
	Addons.RenameDialogPlus = {
		sName: item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name,
		nPos: GetNum(item.getAttribute("MenuPos")),

		Exec: async function (Ctrl, pt) {
			const FV = await GetFolderView(Ctrl, pt);
			if (FV) {
				const Focused = await FV.FocusedItem;
				if (Focused && await api.GetAttributesOf(Focused, SFGAO_CANRENAME)) {
					const opt = await api.CreateObject("Object");
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
		SetMenuExec("RenameDialogPlus", Addons.RenameDialogPlus.sName, item.getAttribute("Menu"), item.getAttribute("MenuPos"));
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.RenameDialogPlus.Exec, "Async");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.RenameDialogPlus.Exec, "Async");
	}

	AddTypeEx("Add-ons", "Rename dialog plus...", Addons.RenameDialogPlus.Exec);
}
