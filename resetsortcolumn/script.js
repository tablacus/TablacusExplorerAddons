Addon_Id = "resetsortcolumn";
Default = "None";

var items = te.Data.Addons.getElementsByTagName(Addon_Id);
if (items.length) {
	var item = items[0];
	if (!item.getAttribute("Set")) {
		item.setAttribute("MenuExec", 1);
		item.setAttribute("Menu", "File");
		item.setAttribute("MenuPos", -1);
	}
}
if (window.Addon == 1) {
	Addons.ResetSortColumn =
	{
		nPos: 0,
		strName: "",

		Exec: function (Ctrl, pt)
		{
			var FV = GetFolderView(Ctrl, pt);
			FV.SortColumn = "System.Null";
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
			Addons.ResetSortColumn.nPos = api.LowPart(item.getAttribute("MenuPos"));
			var s = item.getAttribute("MenuName");
			if (!s) {
				var info = GetAddonInfo(Addon_Id);
				s = info.Name;
			}
			Addons.ResetSortColumn.strName = s;

			AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
			{
				api.InsertMenu(hMenu, Addons.ResetSortColumn.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Addons.ResetSortColumn.strName));
				ExtraMenuCommand[nPos] = Addons.ResetSortColumn.Exec;
				return nPos;
			});
		}
		//Key
		if (item.getAttribute("KeyExec")) {
			SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.ResetSortColumn.Exec, "Func");
		}
		//Mouse
		if (item.getAttribute("MouseExec")) {
			SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.ResetSortColumn.Exec, "Func");
		}
		AddTypeEx("Add-ons", "Reset sort columns", Addons.ResetSortColumn.Exec);
	}
	var h = GetAddonOption(Addon_Id, "IconSize") || window.IconSize || 24;
	var s = GetAddonOption(Addon_Id, "Icon");
	if (s) {
		s = '<img title="' + Addons.ResetSortColumn.strName + '" src="' + s.replace(/"/g, "") + '" width="' + h + 'px" height="' + h + 'px" />';
	} else {
		s = Addons.ResetSortColumn.strName;
	}
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.ResetSortColumn.Exec(this);" oncontextmenu="Addons.ResetSortColumn.Popup(); return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', s, '</span>']);
} else {
	EnableInner();
}

