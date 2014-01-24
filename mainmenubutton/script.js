var Addon_Id = "mainmenubutton";
var Default = "ToolBar2Left";

var items = te.Data.Addons.getElementsByTagName(Addon_Id);
if (items.length) {
	var item = items[0];
	if (!item.getAttribute("Set")) {
		item.setAttribute("KeyOn", "List");
		item.setAttribute("MouseOn", "List");
	}
}
if (window.Addon == 1) {
	Addons.MainMenuButton =
	{
		Popup: function (Ctrl, pt, o)
		{
			(function (Ctrl, pt, o) { setTimeout(function () {
				var strMenus = ["&File", "&Edit", "&View", "F&avorites", "&Tools", "&Help"];
				var hMenu = api.CreatePopupMenu();
				for (var i = strMenus.length; i--;) {
					api.InsertMenu(hMenu, 0, MF_BYPOSITION | MF_STRING, i + 1, GetText(strMenus[i]));
				}
				var FV = Ctrl;
				if (!FV || !(FV.Type <= CTRL_EB)) {
					FV = te.Ctrl(CTRL_FV);
				}
				if (!pt && o) {
					pt = GetPos(o, true);
					pt.y = pt.y + o.offsetHeight;
				}
				if (!pt) {
					pt = api.Memory("POINT");
					var hwnd = api.FindWindowEx(FV.hwndView, 0, WC_LISTVIEW, null);
					if (hwnd) {
						var rc = api.Memory("RECT");
						var i = FV.GetFocusedItem;
						if (api.SendMessage(hwnd, LVM_ISITEMVISIBLE, i, 0)) {
							rc.Left = LVIR_LABEL;
							api.SendMessage(hwnd, LVM_GETITEMRECT, i, rc);
							pt.x = rc.Left;
							pt.y = (rc.Top + rc.Bottom) / 2;
						}
					}
					api.ClientToScreen(FV.hwnd, pt);
				}
				var nVerb = api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null, null);
				api.DestroyMenu(hMenu);
				if (nVerb) {
					ExecMenu(Ctrl || te, strMenus[nVerb - 1].replace("&", ""), pt);
				}
			}, 100);}) (Ctrl, pt, o);
		},

		Exec: function (Ctrl, pt)
		{
			Addons.MainMenuButton.Popup(Ctrl, pt)
			return S_OK;
		}
	};

	var h = GetAddonOption(Addon_Id, "IconSize") || window.IconSize || 24;
	var s = GetAddonOption(Addon_Id, "Icon") || '../addons/mainmenubutton/MainMenuControl_688.png';
	s = 'src="' + s.replace(/"/g, "") + '" height="' + h + 'px"';
	s = '<span class="button" onmousedown="Addons.MainMenuButton.Popup(null, null, this)" oncontextmenu="return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()"><img alt="Main Menu" ' + s + ' /></span> ';
	SetAddon(Addon_Id, Default, s);

	if (items.length) {
		//Key
		if (item.getAttribute("KeyExec")) {
			SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.MainMenuButton.Exec, "Func");
		}
		//Mouse
		if (item.getAttribute("MouseExec")) {
			SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.MainMenuButton.Exec, "Func");
		}

	}
	AddTypeEx("Add-ons", "Main Menu", Addons.MainMenuButton.Exec);
}
