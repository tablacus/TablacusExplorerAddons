var Addon_Id = "emptyrecyclebin";
var Default = "None";

var items = te.Data.Addons.getElementsByTagName(Addon_Id);
if (items.length) {
	var item = items[0];
	if (!item.getAttribute("Set")) {
		item.setAttribute("MenuExec", 1);
		item.setAttribute("Menu", "File");
		item.setAttribute("MenuPos", -1);
		item.setAttribute("MenuName", "Empty Recycle Bin");
	}
}
if (window.Addon == 1) {
	Addons.EmptyRecycleBin =
	{
		nPos: 0,
		strName: "Empty Recycle Bin",

		Exec: function ()
		{
			api.SHEmptyRecycleBin(te.hwnd, null, 0);
			return S_OK;
		},

		Popup: function ()
		{
			return false;
		}
	};
	if (items.length) {
		//Menu
		if (item.getAttribute("MenuExec")) {
			Addons.EmptyRecycleBin.nPos = api.LowPart(item.getAttribute("MenuPos"));
			var s = item.getAttribute("MenuName");
			if (s && s != "") {
				Addons.EmptyRecycleBin.strName = s;
			}
			AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
			{
				api.InsertMenu(hMenu, Addons.EmptyRecycleBin.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Addons.EmptyRecycleBin.strName));
				ExtraMenuCommand[nPos] = Addons.EmptyRecycleBin.Exec;
				return nPos;
			});
		}
		//Key
		if (item.getAttribute("KeyExec")) {
			SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), "Addons.EmptyRecycleBin.Exec();", "JScript");
		}
		//Mouse
		if (item.getAttribute("MouseExec")) {
			SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), "Addons.EmptyRecycleBin.Exec();", "JScript");
		}
		//Type
		AddTypeEx("Add-ons", "Empty Recycle Bin", Addons.EmptyRecycleBin.Exec);
	}
	var h = GetAddonOption(Addon_Id, "IconSize") || window.IconSize || 24;
	var s = GetAddonOption(Addon_Id, "Icon") || (h < 16 ? "icon:shell32.dll,31,16" : "icon:shell32.dll,31,32");
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.EmptyRecycleBin.Exec();" oncontextmenu="Addons.EmptyRecycleBin.Popup(); return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()"><img title="Empty Recycle Bin" src="', s.replace(/"/g, ""), '" width="', h, 'px" height="', h, 'px" /></span>']);
}
