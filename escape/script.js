var Addon_Id = "escape";
var Default = "ToolBar2Left";

(function () {
	var items = te.Data.Addons.getElementsByTagName(Addon_Id);
	if (items.length) {
		var item = items[0];
		if (!item.getAttribute("Set")) {
			item.setAttribute("Menu", "Edit");
			item.setAttribute("MenuPos", -1);
			item.setAttribute("MenuName", "Escape Unicode");

			item.setAttribute("KeyOn", "List");
			item.setAttribute("MouseOn", "List");
		}
	}
	if (window.Addon == 1) {
		Addons.EscapeUnicode =
		{
			Popup: function (Ctrl, pt, o)
			{
				(function (Ctrl, pt, o) { setTimeout(function () {
					hMenu = api.CreatePopupMenu();
					api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, 1, GetText("Escape Unicode"));
					api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, 2, GetText("Unescape Unicode"));
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
					Addons.EscapeUnicode.Exec(FV, nVerb);
				}, 100);}) (Ctrl, pt, o);
			},

			Escape: function (Ctrl, pt)
			{
				var FV = Ctrl;
				if (!FV || !(FV.Type <= CTRL_EB)) {
					FV = te.Ctrl(CTRL_FV);
				}
				Addons.EscapeUnicode.Exec(FV, 1);
			},

			Unescape: function (Ctrl, pt)
			{
				var FV = Ctrl;
				if (!FV || !(FV.Type <= CTRL_EB)) {
					FV = te.Ctrl(CTRL_FV);
				}
				Addons.EscapeUnicode.Exec(FV, 2);
			},

			Exec: function (FV, nVerb)
			{
				var s = "";
				if (nVerb) {
					var Items = FV.Items();
					var List = [];
					for (var i = 0; i < Items.Count; i++) {
						var Path =Items.Item(i).Path;
						var From = fso.GetFileName(Path);
						var To = Addons.EscapeUnicode.EscapeFile(From, nVerb);
						if (api.StrCmpI(From, To)) {
							List.push(From + "\0" + To + "\0" + fso.GetParentFolderName(Path));
						}
					}
					if (List.length) {
						var From = "";
						var To = "";
						var s = GetText("Are you sure?") + "\n";
						for (var i = 0; i < List.length; i++) {
							var Data = List[i].split(/\0/);
							s += Data[0] + ' -> ' + Data[1] + "\n";
							From += fso.BuildPath(Data[2], Data[0]) + "\0";
							To += fso.BuildPath(Data[2], Data[1]) + "\0";
						}
						if (confirm(s)) {
							fileop = api.Memory("SHFILEOPSTRUCT");
							fileop.wFunc = FO_MOVE;
							fileop.fFlags = FOF_MULTIDESTFILES | FOF_RENAMEONCOLLISION | FOF_ALLOWUNDO | FOF_NORECURSION;
							From += "\0";
							pFrom = api.Memory(api.SizeOf("WCHAR") * From.length);
							pFrom.Write(0, VT_LPWSTR, From, From.length);
							fileop.pFrom = pFrom.P;
							To += "\0";
							pTo = api.Memory(api.SizeOf("WCHAR") * To.length);
							pTo.Write(0, VT_LPWSTR, To, To.length);
							fileop.pTo = pTo.P;
							api.SHFileOperation(fileop);
						}
					}
				}
			},

			EscapeFile: function (uni, nMode)
			{
				if (nMode == 2) {
					return unescape(uni);
				}
				var Mem = api.Memory(MAX_PATH);
				Mem.Write(0, VT_LPSTR, uni);
				for (var i = 1; i < MAX_PATH; i++) {
					var c = Mem.Read(i, VT_UI1);
					if (c == 0) {
						break;
					}
					if (c == 0x5c || c == 0x7c) {
						Mem.Write(i - 1, VT_UI1, 0x5c);
					}
				}
				var ansi = Mem.Read(0, VT_LPSTR).replace(/\\./g, "?");
				var enc = "";
				for (var i = 0; i < uni.length; i++) {
					if (ansi.charCodeAt(i) == uni.charCodeAt(i)) {
						enc += uni.charAt(i);
					}
					else {
						enc += escape(uni.charAt(i));
					}
				}
				return enc;
			}

		};

		var h = GetAddonOption(Addon_Id, "IconSize") || window.IconSize || 24;
		var s = GetAddonOption(Addon_Id, "Icon") || '../addons/escape/' + (h > 16 ? 24 : 16) +  '.png';
		s = 'src="' + s.replace(/"/g, "") + '" height="' + h + 'px"';
		s = '<span class="button" onmousedown="Addons.EscapeUnicode.Popup(null, null, this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()"><img alt="Escape Unicode" ' + s + ' /></span> ';
		SetAddon(Addon_Id, Default, s);

		if (items.length) {
			Addons.EscapeUnicode.strName = GetText(item.getAttribute("MenuName") || "Escape Unicode");
			//Menu
			if (item.getAttribute("MenuExec")) {
				Addons.EscapeUnicode.nPos = api.LowPart(item.getAttribute("MenuPos"));
				AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
				{
					var mii = api.Memory("MENUITEMINFO");
					mii.cbSize = mii.Size;
					mii.fMask  = MIIM_STRING | MIIM_SUBMENU;
					mii.dwTypeData = Addons.EscapeUnicode.strName;
					mii.hSubMenu = api.CreatePopupMenu();
					api.InsertMenuItem(hMenu, Addons.EscapeUnicode.nPos, false, mii);
					api.InsertMenu(mii.hSubMenu, 0, MF_BYPOSITION | MF_STRING, ++nPos, GetText("Escape Unicode"));
					ExtraMenuCommand[nPos] = Addons.EscapeUnicode.Escape;
					api.InsertMenu(mii.hSubMenu, 1, MF_BYPOSITION | MF_STRING, ++nPos, GetText("Unescape Unicode"));
					ExtraMenuCommand[nPos] = Addons.EscapeUnicode.Unescape;
					return nPos;
				});
			}
			//Key
			if (item.getAttribute("KeyExec")) {
				SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), "Addons.EscapeUnicode.Popup();", "JScript");
			}
			//Mouse
			if (item.getAttribute("MouseExec")) {
				SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), "Addons.EscapeUnicode.Popup();", "JScript");
			}

		}
		AddTypeEx("Add-ons", "Escape Unicode", Addons.EscapeUnicode.Popup);
	}
})();
