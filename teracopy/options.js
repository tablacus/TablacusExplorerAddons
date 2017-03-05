var arItems = ["Path32", "Class32", "Path64", "Class64", "Copy", "Move"];
var arChecks = ["DiffDriveOnly"];

function RefId(o, s)
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

AddEventEx(window, "load", function ()
{
	ApplyLang(document);

	var info = GetAddonInfo("teracopy");
	document.title = info.Name;
	var items = te.Data.Addons.getElementsByTagName("teracopy");
	if (items.length) {
		var item = items[0];
		for (i in arItems) {
			var s = item.getAttribute(arItems[i]);
			document.F.elements[arItems[i]].value = s ? s : "";
		}
		for (i in arChecks) {
			document.F.elements[arChecks[i]].checked = item.getAttribute(arChecks[i]);
		}
	}
	document.getElementById("GetTeraCopy").value = api.sprintf(999, GetText("Get %s..."), "TeraCopy");
	SetOnChangeHandler();

	AddEventEx(window, "beforeunload", function ()
	{
		if (g_nResult == 2 || !g_bChanged) {
			return;
		}
		if (ConfirmX(true)) {
			var items = te.Data.Addons.getElementsByTagName("teracopy");
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
				for (i in arChecks) {
					if (document.F.elements[arChecks[i]].checked) {
						item.setAttribute(arChecks[i], true);
					}
					else {
						item.removeAttribute(arChecks[i]);
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
