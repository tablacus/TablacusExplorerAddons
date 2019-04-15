var ado = OpenAdodbFromTextFile("addons\\" + Addon_Id + "\\options.html");
if (ado) {
	var ar = ado.ReadText(adReadAll).split("<!--panel-->");
	SetTabContents(0, "General", ar[0]);
	SetTabContents(1, "32-bit", ar[1]);
	SetTabContents(2, "64-bit", ar[2]);
	ado.Close();
}
document.getElementById("GetTeraCopy").value = api.sprintf(999, GetText("Get %s..."), "TeraCopy");

RefId = function(o, s)
{
	var dll = api.PathUnquoteSpaces(ExtractMacro(te, document.F["Path" + (api.sizeof("HANDLE") * 8)].value));
	var cls = document.F["Class" + (api.sizeof("HANDLE") * 8)].value;
	var item = api.GetModuleFileName(null);
	var ContextMenu = api.ContextMenu(dll, cls, fso.GetParentFolderName(item), item, HKEY_CLASSES_ROOT, "Folder", null);
	if (ContextMenu) {
		var hMenu = api.CreatePopupMenu();
		ContextMenu.QueryContextMenu(hMenu, 0, 1, 0x7FFF, CMF_NORMAL);
		var pt = GetPos(o, true);
		var n = api.TrackPopupMenuEx(hMenu, TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y + o.offsetHeight, te.hwnd, null, ContextMenu);
		if (n) {
			SetValue(document.F.elements[s], n);
		}
		api.DestroyMenu(hMenu);
	}
}

RefClass = function (o, s)
{
	var ar = RegEnumKey(HKEY_CLASSES_ROOT, "Folder\\ShellEx\\DragDropHandlers");
	var hMenu = api.CreatePopupMenu();
	try {
		for (var i = ar.length; i-- > 0;) {
			if (!/^{/.test(ar[i])) {
				api.InsertMenu(hMenu, 0, MF_BYPOSITION | MF_STRING, i + 1, ar[i]);
			}
		}
		var pt = GetPos(o, true);
		var nVerb = api.TrackPopupMenuEx(hMenu, TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y + o.offsetHeight, te.hwnd, null, null);
		if (nVerb) {
			SetValue(document.F.elements[s], wsh.RegRead("HKCR\\Folder\\ShellEx\\DragDropHandlers\\" + ar[nVerb - 1] + "\\"));
		}
	} finally {
		api.DestroyMenu(hMenu);
	}
}