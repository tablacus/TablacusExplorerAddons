var Addon_Id = "restart";
var Default = "None";

var item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "File");
	item.setAttribute("MenuPos", -1);
}

if (window.Addon == 1) {
	Addons.Restart =
	{
		nPos: 0,

		Exec: function ()
		{
			SaveConfig();
			te.Reload(true);
			return S_OK;
		},

		Popup: function ()
		{
			return false;
		}
	};
	//Menu
	Addons.Restart.strName = item.getAttribute("MenuName") || GetText(GetAddonInfo(Addon_Id).Name);
	if (item.getAttribute("MenuExec")) {
		Addons.Restart.nPos = api.LowPart(item.getAttribute("MenuPos"));
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
		{
			api.InsertMenu(hMenu, Addons.Restart.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Addons.Restart.strName);
			ExtraMenuCommand[nPos] = Addons.Restart.Exec;
			return nPos;
		});
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.Restart.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.Restart.Exec, "Func");
	}
	AddTypeEx("Add-ons", "Restart", Addons.Restart.Exec);

	var h = GetAddonOption(Addon_Id, "IconSize") || window.IconSize || 24;
	var s = GetAddonOption(Addon_Id, "Icon");
	if (s) {
		s = '<img title="' + Addons.Restart.strName + '" src="' + s.replace(/"/g, "") + '" width="' + h + 'px" height="' + h + 'px" />';
	} else {
		s = Addons.Restart.strName;
	}
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.Restart.Exec();" oncontextmenu="Addons.Restart.Popup(); return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', s, '</span>']);
}
