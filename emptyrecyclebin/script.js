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

		Exec: function () {
			api.SHEmptyRecycleBin(ui_.hwnd, null, 0);
		},

		Popup: async function (el) {
			const hMenu = await api.CreatePopupMenu();
			const ContextMenu = await api.ContextMenu(ssfBITBUCKET);
			if (ContextMenu) {
				await ContextMenu.QueryContextMenu(hMenu, 0, 1, 0x7FFF, CMF_EXTENDEDVERBS);
				const pt = GetPos(el, 9);
				const nVerb = await api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, ui_.hwnd, null, ContextMenu);
				if (nVerb) {
					ContextMenu.InvokeCommand(0, ui_.hwnd, nVerb - 1, null, null, SW_SHOWNORMAL, 0, 0);
				}
			}
			api.DestroyMenu(hMenu);
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
		SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.EmptyRecycleBin.Exec();" oncontextmenu="Addons.EmptyRecycleBin.Popup(this); return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({
			title: Addons.EmptyRecycleBin.sName,
			src: item.getAttribute("Icon") || "icon:shell32.dll,31"
		}, GetIconSizeEx(item)), '</span>']);
		delete item;
	});

	AddTypeEx("Add-ons", "Empty Recycle Bin", Addons.EmptyRecycleBin.Exec);
}
