var Addon_Id = "drivebutton";
var Default = "ToolBar2Left";

if (window.Addon == 1) {
	var item = await GetAddonElement(Addon_Id);

	Addons.DriveButton = {
		strName: item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name,
		nPos: GetNum(item.getAttribute("MenuPos")),

		Down: function (ev, el) {
			if (ev.button == 2) {
				return true;
			}
			setTimeout(async function () {
				MouseOver(el);
				Addons.DriveButton.Exec(await GetFolderViewEx(el), await GetPosEx(el, 9));
			}, 99);
		},

		Exec: async function (Ctrl, pt) {
			var FV = await GetFolderView(Ctrl, pt);
			if (FV) {
				FV.Focus();
			}
			var hMenu = await api.CreatePopupMenu();
			var Items = await $.sha.NameSpace(ssfDRIVES).Items();
			var mii = api.Memory("MENUITEMINFO");
			mii.cbSize = await mii.Size;
			mii.fMask = MIIM_ID | MIIM_STRING | MIIM_BITMAP;
			await $.FolderMenu.Clear();
			var nCount = await Items.Count;
			for (var i = 0; i < nCount; i++) {
				var Item = Items.Item(i);
				if (await api.PathIsRoot(await api.GetDisplayNameOf(Item, SHGDN_FORPARSING)) || await api.GetKeyState(VK_SHIFT) < 0) {
					await $.FolderMenu.AddMenuItem(hMenu, Item);
				}
			}
			if (!pt) {
				pt = await api.Memory("POINT");
				await api.GetCursorPos(pt);
			}
			var nVerb = await $.FolderMenu.TrackPopupMenu(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, await pt.x, await pt.y);
			if (nVerb) {
				$.FolderMenu.Invoke(await $.FolderMenu.Items[nVerb - 1]);
			}
			$.FolderMenu.Clear();
			return S_OK;
		}
	};

	//Menu
	if (item.getAttribute("MenuExec")) {
		Common.DriveButton = await api.CreateObject("Object");
		Common.DriveButton.strMenu = item.getAttribute("Menu");
		Common.DriveButton.strName = item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name;
		Common.DriveButton.nPos = GetNum(item.getAttribute("MenuPos"));
		importJScript("addons\\" + Addon_Id + "\\sync.js");
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

	var h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	var src = item.getAttribute("Icon") || (h <= 16 ? "icon:shell32.dll,8,16" : "icon:shell32.dll,8,32");
	SetAddon(Addon_Id, Default, ['<span class="button" onmousedown="return Addons.DriveButton.Down(event, this)" oncontextmenu="PopupContextMenu(ssfDRIVES); return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({ title: "Drive", src: src }, h), '</span>']);
} else {
	EnableInner();
}
