const Addon_Id = "wildcardselect";
const item = await GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "Edit");
	item.setAttribute("MenuPos", -1);

	item.setAttribute("KeyOn", "List");
	item.setAttribute("Key", "Ctrl+Shift+S");
	item.setAttribute("MouseOn", "List");
}
if (window.Addon == 1) {
	Addons.WildcardSelect = {
		strName: item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name,

		Exec: async function (Ctrl, pt) {
			try {
				const FV = await GetFolderView(Ctrl, pt);
				if (FV && await FV.Items) {
					InputDialog(Addons.WildcardSelect.strName, "", async function (r) {
						if (r) {
							const Items = await FV.Items();
							for (let i = await Items.Count; i-- > 0;) {
								const FolderItem = await Items.Item(i);
								if (await PathMatchEx(await fso.GetFileName(await FolderItem.Path), r)) {
									FV.SelectItem(FolderItem, SVSI_SELECT);
								}
							}
						}
					});
				}
			} catch (e) {
				wsh.Popup(e.description, 0, TITLE, MB_ICONEXCLAMATION);
			}
			return S_OK;
		}
	}

	//Menu
	if (item.getAttribute("MenuExec")) {
		SetMenuExec("WildcardSelect", item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name, item.getAttribute("Menu"), item.getAttribute("MenuPos"));
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.WildcardSelect.Exec, "Async");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.WildcardSelect.Exec, "Async");
	}

	AddTypeEx("Add-ons", "Wildcard Select...", Addons.WildcardSelect.Exec);
}
