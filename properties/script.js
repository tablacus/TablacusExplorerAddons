const Addon_Id = "properties";
const Default = "ToolBar2Left";
let item = await GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.Properties = {
		sName: item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name,

		Exec: async function (Ctrl, pt) {
			const FV = await GetFolderView(Ctrl, pt);
			if (FV) {
				FV.Focus();
				let Items = await FV.SelectedItems();
				if (await Items.Count == 0) {
					Items = await FV.FolderItem;
				}
				const hMenu = await api.CreatePopupMenu();
				const ContextMenu = await api.ContextMenu(Items, FV);
				if (ContextMenu) {
					await ContextMenu.QueryContextMenu(hMenu, 0, 1, 0x7FFF, CMF_DEFAULTONLY);
					await ContextMenu.InvokeCommand(0, ui_.hwnd, CommandID_PROPERTIES - 1, null, null, SW_SHOWNORMAL, 0, 0);
				}
				api.DestroyMenu(hMenu);
			}
		}

	};
	//Menu
	if (item.getAttribute("MenuExec")) {
		SetMenuExec("Properties", Addons.Properties.sName, item.getAttribute("Menu"), item.getAttribute("MenuPos"));
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.Properties.Exec, "Async");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.Properties.Exec, "Async");
	}

	AddEvent("Layout", async function () {
		SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.Properties.Exec(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({
			title: Addons.Properties.sName,
			src: item.getAttribute("Icon") || "icon:general,15"
		}, GetIconSizeEx(item)), '</span>']);
		delete item;
	});
} else {
	EnableInner();
}
