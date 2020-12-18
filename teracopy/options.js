const ar = (await ReadTextFile("addons\\" + Addon_Id + "\\options.html")).split("<!--panel-->");
await SetTabContents(0, "General", ar[0]);
SetTabContents(1, "32-bit", ar[1]);
SetTabContents(2, "64-bit", ar[2]);
document.getElementById("GetTeraCopy").value = await api.sprintf(999, await GetText("Get %s..."), "TeraCopy");

RefId = async function (o, s) {
	const dll = await ExtractPath(te, document.F["Path" + ui_.bit].value);
	const cls = document.F["Class" + ui_.bit].value;
	const item = await api.GetModuleFileName(null);
	const ContextMenu = await api.ContextMenu(dll, cls, GetParentFolderName(item), item, HKEY_CLASSES_ROOT, "Folder", null);
	if (ContextMenu) {
		const hMenu = api.CreatePopupMenu();
		ContextMenu.QueryContextMenu(hMenu, 0, 1, 0x7FFF, CMF_NORMAL);
		const pt = GetPos(o, 9);
		const n = api.TrackPopupMenuEx(hMenu, TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, ui_.hwnd, null, ContextMenu);
		if (n) {
			SetValue(document.F.elements[s], n);
		}
		api.DestroyMenu(hMenu);
	}
}

RefClass = async function (o, s) {
	const ar = await RegEnumKey(HKEY_CLASSES_ROOT, "Folder\\ShellEx\\DragDropHandlers", window.chrome);
	const hMenu = await api.CreatePopupMenu();
	try {
		for (var i = ar.length; i-- > 0;) {
			if (!/^{/.test(ar[i])) {
				await api.InsertMenu(hMenu, 0, MF_BYPOSITION | MF_STRING, i + 1, ar[i]);
			}
		}
		const pt = GetPos(o, 9);
		const nVerb = api.TrackPopupMenuEx(hMenu, TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, ui_.hwnd, null, null);
		if (nVerb) {
			SetValue(document.F.elements[s], await wsh.RegRead("HKCR\\Folder\\ShellEx\\DragDropHandlers\\" + ar[nVerb - 1] + "\\"));
		}
	} finally {
		api.DestroyMenu(hMenu);
	}
}
