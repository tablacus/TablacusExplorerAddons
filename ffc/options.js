const arItems = ["Path", "Class", "Copy", "Move"];
const arChecks = ["DiffDriveOnly"];

SetTabContents(0, "", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));
setTimeout(async function () {
	document.getElementById("GetFFC").value = await api.sprintf(999, await GetText("Get %s..."), "Fire File Copy");
}, 99);

RefId = async function (o, s) {
	const dll = await ExtractPath(te, document.F.Path.value);
	const cls = document.F.Class.value || await GetAddonOption("ffc", "Class") || "{E6385E40-E2A6-11d5-ABE6-9EB61339EA35}";
	const item = await api.GetModuleFileName(null);
	const ContextMenu = await api.ContextMenu(dll, cls, GetParentFolderName(item), item, HKEY_CLASSES_ROOT, "Folder", null) || await api.ContextMenu(dll.replace(/_?64(\.dll)/i, "$1"), cls, GetParentFolderName(item), item, HKEY_CLASSES_ROOT, "Folder", null);
	if (ContextMenu) {
		const hMenu = await api.CreatePopupMenu();
		await ContextMenu.QueryContextMenu(hMenu, 0, 1, 0x7FFF, CMF_NORMAL);
		const pt = GetPos(o, 9);
		const n = await api.TrackPopupMenuEx(hMenu, TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, ui_.hwnd, null, ContextMenu);
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
