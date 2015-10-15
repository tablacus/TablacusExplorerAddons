Addon_Id = "resetcolumns";
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
	Addons.ResetColumns =
	{
		nPos: 0,
		strName: "",

		Exec: function (Ctrl, pt)
		{
			var FV = GetFolderView(Ctrl, pt);
			FV.Columns = "";
			FV.Focus();
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
			Addons.ResetColumns.nPos = api.LowPart(item.getAttribute("MenuPos"));
			var s = item.getAttribute("MenuName");
			if (!s) {
				var info = GetAddonInfo(Addon_Id);
				s = info.Name;
			}
			Addons.ResetColumns.strName = s;

			AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
			{
				api.InsertMenu(hMenu, Addons.ResetColumns.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Addons.ResetColumns.strName));
				ExtraMenuCommand[nPos] = Addons.ResetColumns.Exec;
				return nPos;
			});
		}
		//Key
		if (item.getAttribute("KeyExec")) {
			SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.ResetColumns.Exec, "Func");
		}
		//Mouse
		if (item.getAttribute("MouseExec")) {
			SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.ResetColumns.Exec, "Func");
		}
		AddTypeEx("Add-ons", "Reset Columns", Addons.ResetColumns.Exec);
	}
	var h = GetAddonOption(Addon_Id, "IconSize") || window.IconSize || 24;
	var s = GetAddonOption(Addon_Id, "Icon");
	if (s) {
		s = '<img title="' + Addons.ResetColumns.strName + '" src="' + s.replace(/"/g, "") + '" width="' + h + 'px" height="' + h + 'px" />';
	} else {
		s = Addons.ResetColumns.strName;
	}
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.ResetColumns.Exec(this);" oncontextmenu="Addons.ResetColumns.Popup(); return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', s, '</span>']);
} else {
	EnableInner();
}

