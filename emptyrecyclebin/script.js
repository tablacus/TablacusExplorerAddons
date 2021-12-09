const Addon_Id = "emptyrecyclebin";
const Default = "None";
let item = await GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "File");
	item.setAttribute("MenuPos", -1);
}
if (window.Addon == 1) {
	Addons.EmptyRecycleBin = {
		sName: item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name,

		Exec: async function () {
			const mii = await api.Memory("MENUITEMINFO");
			mii.fMask = MIIM_ID | MIIM_STATE;
			const hMenu = await api.CreatePopupMenu();
			const ContextMenu = await api.ContextMenu(ssfBITBUCKET);
			if (ContextMenu) {
				await ContextMenu.QueryContextMenu(hMenu, 0, 1, 0x7FFF, CMF_NORMAL);
				for (let i = await api.GetMenuItemCount(hMenu); i-- > 0;) {
					if (await api.GetMenuItemInfo(hMenu, i, true, mii)) {
						if (await ContextMenu.GetCommandString(await mii.wID - 1, GCS_VERB) == "empty") {
							break;
						}
					}
					mii.fState = 0;
				}
			}
			api.DestroyMenu(hMenu);
			if (!await mii.fState) {
				api.SHEmptyRecycleBin(ui_.hwnd, null, 0);
			}
		}
	};
	//Menu
	if (item.getAttribute("MenuExec")) {
		SetMenuExec("EmptyRecycleBin", Addons.EmptyRecycleBin.sName, item.getAttribute("Menu"), item.getAttribute("MenuPos"));
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.EmptyRecycleBin.Exec, "Async");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.EmptyRecycleBin.Exec, "Async");
	}

	AddEvent("Layout", async function () {
		SetAddon(Addon_Id, Default, [await GetImgTag({
			onclick: "Addons.EmptyRecycleBin.Exec()",
			oncontextmenu: "PopupContextMenu(ssfBITBUCKET); return false",
			title: Addons.EmptyRecycleBin.sName,
			src: item.getAttribute("Icon") || "icon:shell32.dll,31",
			"class": "button"
		}, GetIconSizeEx(item))]);
		delete item;
	});

	AddTypeEx("Add-ons", "Empty Recycle Bin", Addons.EmptyRecycleBin.Exec);
}
