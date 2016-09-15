var arItems = ["Path", "Class", "Copy", "Move"];

function RefId(o, s)
{
	var dll = api.PathUnquoteSpaces(ExtractMacro(te, document.F.Path.value));
	var cls = document.F.Class.value;
	var cls2 = GetAddonOption("ffc", "Class");
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

function RefClass(o, s)
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
	}
	finally {
		api.DestroyMenu(hMenu);
	}
}

AddEventEx(window, "load", function ()
{
	ApplyLang(document);

	var info = GetAddonInfo("ffc");
	document.title = info.Name;
	var items = te.Data.Addons.getElementsByTagName("ffc");
	if (items.length) {
		var item = items[0];
		for (i in arItems) {
			var s = item.getAttribute(arItems[i]);
			document.F.elements[arItems[i]].value = s ? s : "";
		}
	}

	SetOnChangeHandler();

	AddEventEx(window, "beforeunload", function ()
	{
		if (g_nResult == 2 || !g_bChanged) {
			return;
		}
		if (ConfirmX(true)) {
			var items = te.Data.Addons.getElementsByTagName("ffc");
			if (items.length) {
				var item = items[0];
				for (i in arItems) {
					var s = document.F.elements[arItems[i]].value;
					if (s.length) {
						item.setAttribute(arItems[i], s);
					} else {
						item.removeAttribute(arItems[i]);
					}
				}
				item.setAttribute("Set", 1);
				TEOk();
			}
			return;
		}
		event.returnValue = GetText('Close');
	});
});
