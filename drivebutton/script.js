const Addon_Id = "drivebutton";
const Default = "ToolBar2Left";

if (window.Addon == 1) {
	let item = await GetAddonElement(Addon_Id);

	Addons.DriveButton = {
		Down: function (ev, el) {
			if ((ev.buttons != null ? ev.buttons : ev.button) == 2) {
				return true;
			}
			setTimeout(async function () {
				MouseOver(el);
				Addons.DriveButton.Exec(await GetFolderViewEx(el), await GetPosEx(el, 9));
			}, 99);
		},

		Exec: async function (Ctrl, pt) {
			let FV = await GetFolderView(Ctrl, pt);
			if (FV) {
				FV.Focus();
			}
			let hMenu = await api.CreatePopupMenu();
			let Items = await sha.NameSpace(ssfDRIVES).Items();
			let mii = api.Memory("MENUITEMINFO");
			mii.cbSize = await mii.Size;
			mii.fMask = MIIM_ID | MIIM_STRING | MIIM_BITMAP;
			await FolderMenu.Clear();
			let nCount = await Items.Count;
			for (let i = 0; i < nCount; i++) {
				let Item = await Items.Item(i);
				if (await api.PathIsRoot(await api.GetDisplayNameOf(Item, SHGDN_FORPARSING)) || await api.GetKeyState(VK_SHIFT) < 0) {
					await FolderMenu.AddMenuItem(hMenu, Item);
				}
			}
			if (!pt) {
				pt = await api.Memory("POINT");
				await api.GetCursorPos(pt);
			}
			let nVerb = await FolderMenu.TrackPopupMenu(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, await pt.x, await pt.y);
			if (nVerb) {
				FolderMenu.Invoke(await FolderMenu.Items[nVerb - 1]);
			}
			FolderMenu.Clear();
			return S_OK;
		}
	};

	//Menu
	const strName = item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name;
	if (item.getAttribute("MenuExec")) {
		SetMenuExec("DriveButton", strName, item.getAttribute("Menu"), item.getAttribute("MenuPos"));
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.DriveButton.Exec, "Async");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.DriveButton.Exec, "Async");
	}

	AddTypeEx("Add-ons", "Drive button", Addons.DriveButton.Exec);

	let h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	let src = item.getAttribute("Icon") || (h <= 16 ? "icon:shell32.dll,8,16" : "icon:shell32.dll,8,32");
	SetAddon(Addon_Id, Default, ['<span class="button" onmousedown="return Addons.DriveButton.Down(event, this)" oncontextmenu="PopupContextMenu(ssfDRIVES); return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({ title: strName, src: src }, h), '</span>']);
} else {
	EnableInner();
}
