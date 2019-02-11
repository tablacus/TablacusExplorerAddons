var arItems = ["Path", "Class", "Copy", "Move"];
var arChecks = ["DiffDriveOnly"];

var ado = OpenAdodbFromTextFile("addons\\" + Addon_Id + "\\options.html");
if (ado) {
	SetTabContents(0, "", ado.ReadText(adReadAll));
	ado.Close();
}
document.getElementById("GetFFC").value = api.sprintf(999, GetText("Get %s..."), "Fire File Copy");

RefId = function (o, s)
{
	var dll = api.PathUnquoteSpaces(ExtractMacro(te, document.F.Path.value));
	var cls = document.F.Class.value || GetAddonOption("ffc", "Class");
	var item = api.GetModuleFileName(null);
	var ContextMenu = api.ContextMenu(dll, cls, fso.GetParentFolderName(item), item, HKEY_CLASSES_ROOT, "Folder", null) || api.ContextMenu(dll.replace(/_?64(\.dll)/i, "$1"), cls, fso.GetParentFolderName(item), item, HKEY_CLASSES_ROOT, "Folder", null);
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