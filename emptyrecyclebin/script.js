var Addon_Id = "emptyrecyclebin";
var Default = "None";

var item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "File");
	item.setAttribute("MenuPos", -1);
}
if (window.Addon == 1) {
	Addons.EmptyRecycleBin =
	{
		nPos: 0,
		strName: GetText("Empty Recycle Bin"),

		Exec: function ()
		{
			api.SHEmptyRecycleBin(te.hwnd, null, 0);
			return S_OK;
		},

		Popup: function ()
		{
			var hMenu = api.CreatePopupMenu();
			var ContextMenu = api.ContextMenu(ssfBITBUCKET);
			if (ContextMenu) {
				ContextMenu.QueryContextMenu(hMenu, 0, 1, 0x7FFF, CMF_EXTENDEDVERBS);
				var pt = api.Memory("POINT");
				api.GetCursorPos(pt);
				var nVerb = api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null, ContextMenu);
				if (nVerb) {
					ContextMenu.InvokeCommand(0, te.hwnd, nVerb - 1, null, null, SW_SHOWNORMAL, 0, 0);
				}
			}
			api.DestroyMenu(hMenu);
			return false;
		}
	};
	//Menu
	if (item.getAttribute("MenuExec")) {
		Addons.EmptyRecycleBin.nPos = api.LowPart(item.getAttribute("MenuPos"));
		var s = item.getAttribute("MenuName");
		if (s) {
			Addons.EmptyRecycleBin.strName = s;
		}
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
		{
			api.InsertMenu(hMenu, Addons.EmptyRecycleBin.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Addons.EmptyRecycleBin.strName);
			ExtraMenuCommand[nPos] = Addons.EmptyRecycleBin.Exec;
			return nPos;
		});
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.EmptyRecycleBin.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.EmptyRecycleBin.Exec, "Func");
	}
	//Type
	AddTypeEx("Add-ons", "Empty Recycle Bin", Addons.EmptyRecycleBin.Exec);

	var h = GetIconSize(GetAddonOption(Addon_Id, "IconSize"));
	var s = GetAddonOption(Addon_Id, "Icon") || "icon:shell32.dll,31";
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.EmptyRecycleBin.Exec();" oncontextmenu="return Addons.EmptyRecycleBin.Popup();" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', GetImgTag({ title: Addons.EmptyRecycleBin.strName, src: s }, h), '</span>']);
}
