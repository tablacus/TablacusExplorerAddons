var Addon_Id = "restart";
var Default = "None";

var items = te.Data.Addons.getElementsByTagName(Addon_Id);
if (items.length) {
	var item = items[0];
	if (!item.getAttribute("Set")) {
		item.setAttribute("MenuExec", 1);
		item.setAttribute("Menu", "File");
		item.setAttribute("Menu", "File");
		item.setAttribute("MenuPos", -1);
		item.setAttribute("MenuName", "Restart");
	}
}
if (window.Addon == 1) {
	Addons.Restart =
	{
		nPos: 0,
		strName: "Restart",

		Exec: function ()
		{
			AddEvent("SystemMessage", function (Ctrl, hwnd, msg, wParam, lParam)
			{
				if (msg == WM_COPYDATA) {
					return E_NOTIMPL;
				}
			});
			SaveConfig();
			wsh.Run(api.PathQuoteSpaces(api.GetModuleFileName(null)), SW_SHOWNORMAL, false);
			api.PostMessage(te.hwnd, WM_CLOSE, 0, 0);
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
			Addons.Restart.nPos = api.LowPart(item.getAttribute("MenuPos"));
			var s = item.getAttribute("MenuName");
			if (s && s != "") {
				Addons.Restart.strName = s;
			}
			AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
			{
				api.InsertMenu(hMenu, Addons.Restart.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Addons.Restart.strName));
				ExtraMenuCommand[nPos] = Addons.Restart.Exec;
				return nPos;
			});
		}
		//Key
		if (item.getAttribute("KeyExec")) {
			SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), "Addons.Restart.Exec();", "JScript");
		}
		//Mouse
		if (item.getAttribute("MouseExec")) {
			SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), "Addons.Restart.Exec();", "JScript");
		}
		
		AddTypeEx("Add-ons", "Restart", Addons.Restart.Exec);
	}
	var h = GetAddonOption(Addon_Id, "IconSize") || window.IconSize || 24;
	var s = GetAddonOption(Addon_Id, "Icon");
	if (s) {
		s = '<img title="Restart" src="' + s.replace(/"/g, "") + '" width="' + h + 'px" height="' + h + 'px" />';
	}
	else {
		s = GetText('Restart');
	}
	SetAddon(Addon_Id, Default, ['<span class="button" id="UpButton" onclick="Addons.Restart.Exec();" oncontextmenu="Addons.Restart.Popup(); return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', s ,'</span>']);
}
