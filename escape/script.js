var Addon_Id = "escape";
var Default = "ToolBar2Left";

var item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("Menu", "Edit");
	item.setAttribute("MenuPos", -1);

	item.setAttribute("KeyOn", "List");
	item.setAttribute("MouseOn", "List");
}
if (window.Addon == 1) {
	Addons.EscapeUnicode =
	{
		strName: item.getAttribute("MenuName") || GetText("Escape Unicode"),

		Popup: function (Ctrl, pt, o)
		{
			setTimeout(function ()
			{
				hMenu = api.CreatePopupMenu();
				api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, 1, GetText("Escape Unicode"));
				api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, 2, GetText("Unescape Unicode"));
				var FV = GetFolderView(Ctrl, pt);
				if (!pt && o) {
					pt = GetPos(o, true);
					pt.y = pt.y + o.offsetHeight;
					FV = GetFolderView(o);
					FV.Focus();
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
			}, 100);
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
						List.push([From, To, fso.GetParentFolderName(Path)].join("\0"));
					}
				}
				if (List.length) {
					var From = [];
					var To = [];
					var s = [GetText("Are you sure?")];
					for (var i in List) {
						var Data = List[i].split("\0");
						s.push(Data[0] + ' -> ' + Data[1]);
						From.push(fso.BuildPath(Data[2], Data[0]));
						To.push(fso.BuildPath(Data[2], Data[1]));
					}
					if (confirm(s.join("\n"))) {
						api.SHFileOperation(FO_MOVE, From.join("\0"), To.join("\0"), FOF_MULTIDESTFILES | FOF_RENAMEONCOLLISION | FOF_ALLOWUNDO | FOF_NORECURSION, false);
					}
				}
			}
		},

		EscapeFile: function (uni, nMode)
		{
			if (nMode == 2) {
				return unescape(uni);
			}
			var nSize = uni.length * 2 + 1;
			var Mem = api.Memory(nSize);
			Mem.Write(0, VT_LPSTR, uni);
			for (var i = 1; i < nSize; i++) {
				var c = Mem.Read(i, VT_UI1);
				if (c == 0) {
					break;
				}
				if (c == 0x5c || c == 0x7c) {
					Mem.Write(i - 1, VT_UI1, 0x5c);
				}
			}
			var ansi = Mem.Read(0, VT_LPSTR).replace(/\\./g, "?");
			var enc = new Array(uni.length);
			for (var i = uni.length; i-- > 0;) {
				c = uni.charAt(i);
				enc[i] = (ansi.charAt(i) == c) ? c : escape(c);
			}
			return enc.join("");
		}

	};

	var h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	var s = item.getAttribute("Icon") || '../addons/escape/' + (h > 16 ? 24 : 16) +  '.png';
	SetAddon(Addon_Id, Default, ['<span class="button" onmousedown="Addons.EscapeUnicode.Popup(null, null, this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', GetImgTag({ title: "Escape Unicode", src: s }, h), '</span>']);

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
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.EscapeUnicode.Popup, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.EscapeUnicode.Popup, "Func");
	}
	AddTypeEx("Add-ons", "Escape Unicode", Addons.EscapeUnicode.Popup);
} else {
	EnableInner();
}
