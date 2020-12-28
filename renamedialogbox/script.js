const Addon_Id = "renamedialogbox";
const item = await GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("KeyExec", true);
	item.setAttribute("KeyOn", "List");
	item.setAttribute("Key", "F2");
	item.setAttribute("MouseOn", "List");
}

if (window.Addon == 1) {
	Addons.RenameDialogBox = {
		Exec: async function (Ctrl, pt) {
			const FV = await GetFolderView(Ctrl, pt);
			if (FV) {
				const Focused = await FV.FocusedItem;
				if (Focused) {
					if (await api.GetAttributesOf(Focused, SFGAO_CANRENAME)) {
						const s = await api.GetDisplayNameOf(Focused, SHGDN_FOREDITING | SHGDN_INFOLDER);
						InputDialog(s, s, async function (r) {
							if (/[\\\/:,;\*\?"<>\|]/.test(r)) {
								MessageBox(await api.LoadString(hShell32, 4109), null, MB_ICONSTOP | MB_OK);
								setTimeout(Addons.RenameDialogBox.Exec, 9, Ctrl, pt);
								return;
							}
							if (s != r) {
								try {
									Focused.Name = r;
								} catch (e) {
									MessageBox((await api.LoadString(hShell32, 6020)).replace("%1!ls!", (await api.sprintf(99, "0x%x", e.number)).replace("%2!ls!", s), null, MB_ICONSTOP | MB_OK));
								}
							}
						});
					}
					return S_OK;
				}
			}
		}
	};
	//Menu
	const strName = item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name;
	if (item.getAttribute("MenuExec")) {
		Common.RenameDialogBox = await api.CreateObject("Object");
		Common.RenameDialogBox.strMenu = item.getAttribute("Menu");
		Common.RenameDialogBox.strName = strName;
		Common.RenameDialogBox.nPos = GetNum(item.getAttribute("MenuPos"));
		$.importScript("addons\\" + Addon_Id + "\\sync.js");
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.RenameDialogBox.Exec, "Async");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.RenameDialogBox.Exec, "Async");
	}
	AddTypeEx("Add-ons", "Rename Dialog Box...", Addons.RenameDialogBox.Exec);
}
