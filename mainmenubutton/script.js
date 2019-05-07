var Addon_Id = "mainmenubutton";
var Default = "ToolBar1Left";

var item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("KeyOn", "List");
	item.setAttribute("MouseOn", "List");
}
if (window.Addon == 1) {
	Addons.MainMenuButton =
	{
		key: 0,
		strMenus: ["&File", "&Edit", "&View", "F&avorites", "&Tools", "&Help"],

		Popup: function (Ctrl, pt, o)
		{
			if (!pt && o) {
				pt = GetPos(o, true);
				pt.y += o.offsetHeight;
				Ctrl = GetFolderView(o);
				Ctrl.Focus();
			}
			if (Addons.MainMenuButton.nCloseId == Ctrl.Id) {
				return;
			}
			Addons.MainMenuButton.bLoop = true;
			AddEvent("ExitMenuLoop", function () {
				Addons.MainMenuButton.bLoop = false;
				Addons.MainMenuButton.nCloseId = Ctrl.Id;
				clearTimeout(Addons.MainMenuButton.tid2);
				Addons.MainMenuButton.tid2 = setTimeout("Addons.MainMenuButton.nCloseId = 0;", 500);
			});
			g_nPos = 0;
			var hMenu = api.CreatePopupMenu();
			for (var i = Addons.MainMenuButton.strMenus.length; i--;) {
				var mii = api.Memory("MENUITEMINFO");
				mii.cbSize = mii.Size;
				mii.fMask = MIIM_STRING | MIIM_SUBMENU;
				mii.dwTypeData = GetText(Addons.MainMenuButton.strMenus[i]);
				mii.hSubMenu = api.CreatePopupMenu();
				api.InsertMenu(mii.hSubMenu, 0, MF_BYPOSITION | MF_STRING, 0, api.sprintf(99, '\tJScript\tAddons.MainMenuButton.OpenSubMenu("%llx",%d,"%llx")', hMenu, i, mii.hSubMenu));
				api.InsertMenuItem(hMenu, 0, true, mii);
			}
			Ctrl = Ctrl || te;
			var ar = GetSelectedArray(Ctrl, pt);
			var Selected = ar.shift();
			var SelItem = ar.shift();
			var FV = ar.shift();
			ExtraMenuCommand = [];
			ExtraMenuData = [];
			eventTE.menucommand = [];

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
			Addons.MainMenuButton.Ctrl = Ctrl;
			Addons.MainMenuButton.pt = pt;
			Addons.MainMenuButton.FV = FV;
			Addons.MainMenuButton.ContextMenu = [];
			Addons.MainMenuButton.Selected = Selected;
			Addons.MainMenuButton.SelItem = SelItem;
			Addons.MainMenuButton.uCMF = Ctrl.Type != CTRL_TV ? CMF_NORMAL | CMF_CANRENAME : CMF_EXPLORE | CMF_CANRENAME;
			Addons.MainMenuButton.arItem = {};
			if (api.GetKeyState(VK_SHIFT) < 0) {
				Addons.MainMenuButton.uCMF |= CMF_EXTENDEDVERBS;
			}
			var nVerb = api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null, Addons.MainMenuButton.ContextMenu);
			var Name = Addons.MainMenuButton.strMenus[0].replace("&", "");
			for (var i = Addons.MainMenuButton.strMenus.length; i--;) {
				api.GetMenuItemInfo(hMenu, i, true, mii);
				mii.fMask = MIIM_SUBMENU;
				if (api.GetMenuString(mii.hSubMenu, nVerb, MF_BYCOMMAND)) {
					Name = Addons.MainMenuButton.strMenus[i].replace("&", "");
				}
			}
			if (nVerb) {
				var mii = api.Memory("MENUITEMINFO");
				mii.cbSize = mii.Size;
				mii.fMask = MIIM_SUBMENU;
				var hr = ExecMenu4(Ctrl, Name, pt, hMenu, Addons.MainMenuButton.ContextMenu, nVerb, Addons.MainMenuButton.FV);
				if (isFinite(hr)) {
					return hr;
				}
				var item = Addons.MainMenuButton.arItem[nVerb - 1];
				if (item) {
					var s = item.getAttribute("Type");
					Exec(Ctrl, item.text, window.g_menu_button == 3 && s == "Open" ? "Open in new tab" : s, Ctrl.hwnd, pt);
					return S_OK;
				}
			} else {
				api.DestroyMenu(hMenu);
			}
		},

		Exec: function (Ctrl, pt)
		{
			Addons.MainMenuButton.Popup(Ctrl, pt)
			return S_OK;
		},

		OpenSubMenu: function (hMenu, wID, hSubMenu)
		{
			hMenu = api.sscanf(hSubMenu, "%llx");
			var Name = Addons.MainMenuButton.strMenus[wID].replace("&", "");
			var items = null;
			var menus = teMenuGetElementsByTagName(Name);
			if (menus && menus.length) {
				items = menus[0].getElementsByTagName("Item");
				var nBase = api.QuadPart(menus[0].getAttribute("Base"));
				Addons.MainMenuButton.ContextMenu.push(GetBaseMenuEx(hMenu, nBase, Addons.MainMenuButton.FV, Addons.MainMenuButton.Selected, Addons.MainMenuButton.uCMF, 0, Addons.MainMenuButton.SelItem, Addons.MainMenuButton.ContextMenu));
				if (nBase < 5) {
					AdjustMenuBreak(hMenu);
				}
				var arMenu;
				if (items) {
					var x = g_nPos;
					arMenu = OpenMenu(items, Addons.MainMenuButton.SelItem);
					g_nPos = MakeMenus(hMenu, menus, arMenu, items, Ctrl, pt, g_nPos, Addons.MainMenuButton.arItem, true);

					var eo = eventTE[Name.toLowerCase()];
					for (var i in eo) {
						try {
							g_nPos = eo[i](Addons.MainMenuButton.Ctrl, hMenu, g_nPos, Addons.MainMenuButton.Selected, Addons.MainMenuButton.SelItem, Addons.MainMenuButton.ContextMenu[0], Name, Addons.MainMenuButton.pt);
						} catch (e) {
							ShowError(e, Name, i);
						}
					}
					for (var i in eventTE.menus) {
						try {
							g_nPos = eventTE.menus[i](Addons.MainMenuButton.Ctrl, hMenu, g_nPos, Addons.MainMenuButton.Selected, Addons.MainMenuButton.SelItem, Addons.MainMenuButton.ContextMenu[0], Name, Addons.MainMenuButton.pt);
						} catch (e) {
							ShowError(e, "Menus", i);
						}
					}
				}
			}
		}
	};

	var h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	var s = item.getAttribute("Icon") || '../addons/mainmenubutton/menu.png';
	SetAddon(Addon_Id, Default, ['<span id="mainmenubutton1" class="button" onmousedown="Addons.MainMenuButton.Popup(null, null, this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', GetImgTag({ title: "Main menu", src: s }, h), '</span>']);

	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.MainMenuButton.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.MainMenuButton.Exec, "Func");
	}

	AddTypeEx("Add-ons", "Main Menu", Addons.MainMenuButton.Exec);

	AddEvent("KeyMessage", function (Ctrl, hwnd, msg, key, keydata)
	{
		if (msg == WM_KEYDOWN || msg == WM_SYSKEYDOWN) {
			Addons.MainMenuButton.key = Addons.MainMenuButton.key != VK_MENU && (keydata & 0x40000000) ? 0 : key;
		} else if (key == VK_MENU && msg == WM_SYSKEYUP && key == Addons.MainMenuButton.key) {
			Addons.MainMenuButton.Popup(null, null, document.getElementById("mainmenubutton1"));
			return S_OK;
		}
	});

	AddEvent("MouseMessage", function (Ctrl, hwnd, msg, wParam, pt)
	{
		if (msg != WM_MOUSEMOVE) {
			Addons.MainMenuButton.key = 0;
		}
	});
} else {
	EnableInner();
}
