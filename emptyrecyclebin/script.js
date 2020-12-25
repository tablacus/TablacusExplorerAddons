const Addon_Id = "emptyrecyclebin";
const Default = "None";
const item = await GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "File");
	item.setAttribute("MenuPos", -1);
}
if (window.Addon == 1) {
	Addons.EmptyRecycleBin = {
		Exec: function () {
			api.SHEmptyRecycleBin(ui_.hwnd, null, 0);
		},

		Popup: async function (ev) {
			const hMenu = await api.CreatePopupMenu();
			const ContextMenu = await api.ContextMenu(ssfBITBUCKET);
			if (ContextMenu) {
				await ContextMenu.QueryContextMenu(hMenu, 0, 1, 0x7FFF, CMF_EXTENDEDVERBS);
				const x = ev.screenX * ui_.Zoom;
				const y = ev.screenY * ui_.Zoom;
				const nVerb = await api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, x, y, ui_.hwnd, null, ContextMenu);
				if (nVerb) {
					ContextMenu.InvokeCommand(0, ui_.hwnd, nVerb - 1, null, null, SW_SHOWNORMAL, 0, 0);
				}
			}
			api.DestroyMenu(hMenu);
		}
	};
	//Menu
	if (item.getAttribute("MenuExec")) {
		Common.EmptyRecycleBin = await api.CreateObject("Object");
		Common.EmptyRecycleBin.strMenu = item.getAttribute("Menu");
		Common.EmptyRecycleBin.strName = item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name;
		Common.EmptyRecycleBin.nPos = GetNum(item.getAttribute("MenuPos"));
		$.importScript("addons\\" + Addon_Id + "\\sync.js");
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.EmptyRecycleBin.Exec, "Async");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.EmptyRecycleBin.Exec, "Async");
	}
	//Type
	AddTypeEx("Add-ons", "Empty Recycle Bin", Addons.EmptyRecycleBin.Exec);

	const h = GetIconSize(item.getAttribute("IconSize"));
	const s = item.getAttribute("Icon") || "icon:shell32.dll,31";
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.EmptyRecycleBin.Exec();" oncontextmenu="return Addons.EmptyRecycleBin.Popup(event);return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({ title: item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name, src: s }, h), '</span>']);
}
