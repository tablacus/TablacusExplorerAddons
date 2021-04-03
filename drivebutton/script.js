const Addon_Id = "drivebutton";
const Default = "ToolBar2Left";
if (window.Addon == 1) {
	let item = await GetAddonElement(Addon_Id);

	Addons.DriveButton = {
		sName: item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name,

		Exec: async function (Ctrl, pt) {
			const FV = await GetFolderView(Ctrl, pt);
			if (FV) {
				FV.Focus();
			}
			const hMenu = await api.CreatePopupMenu();
			const Items = await sha.NameSpace(ssfDRIVES).Items();
			await FolderMenu.Clear();
			const nCount = await Items.Count;
			for (let i = 0; i < nCount; i++) {
				const Item = await Items.Item(i);
				if (await api.PathIsRoot(await api.GetDisplayNameOf(Item, SHGDN_FORPARSING)) || await api.GetKeyState(VK_SHIFT) < 0) {
					await FolderMenu.AddMenuItem(hMenu, Item);
				}
			}
			if (!pt) {
				pt = await api.Memory("POINT");
				await api.GetCursorPos(pt);
			}
			const nVerb = await FolderMenu.TrackPopupMenu(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, await pt.x, await pt.y);
			if (nVerb) {
				FolderMenu.Invoke(await FolderMenu.Items[nVerb - 1]);
			}
			FolderMenu.Clear();
			return S_OK;
		},

		Popup: async function(Ctrl, pt) {
			PopupContextMenu(ssfDRIVES, null, pt);
		}
	};

	//Menu
	if (item.getAttribute("MenuExec")) {
		SetMenuExec("DriveButton", Addons.DriveButton.sName, item.getAttribute("Menu"), item.getAttribute("MenuPos"));
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.DriveButton.Exec, "Async");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.DriveButton.Exec, "Async");
	}

	AddEvent("Layout", async function () {
		SetAddon(Addon_Id, Default, ['<span class="button" onclick="SyncExec(Addons.DriveButton.Exec, this, 9)" oncontextmenu="SyncExec(Addons.DriveButton.Popup, this, 9); return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({
			title: Addons.DriveButton.sName,
			src: item.getAttribute("Icon") || "icon:shell32.dll,8"
		}, GetIconSizeEx(item)), '</span>']);
		delete item;
	});

	AddTypeEx("Add-ons", "Drive button", Addons.DriveButton.Exec);
} else {
	EnableInner();
}
