const Addon_Id = "escape";
const item = GetAddonElement(Addon_Id);

Sync.EscapeUnicode = {
	strName: item.getAttribute("MenuName") || GetText("Escape Unicode"),

	Popup: function (Ctrl, pt) {
		const hMenu = api.CreatePopupMenu();
		api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, 1, GetText("Escape Unicode"));
		api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, 2, GetText("Unescape Unicode"));
		const FV = GetFolderView(Ctrl, pt);
		if (!pt) {
			pt = api.Memory("POINT");
			const hwnd = api.FindWindowEx(FV.hwndView, 0, WC_LISTVIEW, null);
			if (hwnd) {
				const rc = api.Memory("RECT");
				const i = FV.GetFocusedItem;
				if (api.SendMessage(hwnd, LVM_ISITEMVISIBLE, i, 0)) {
					rc.Left = LVIR_LABEL;
					api.SendMessage(hwnd, LVM_GETITEMRECT, i, rc);
					pt.x = rc.Left;
					pt.y = (rc.Top + rc.Bottom) / 2;
				}
			}
			api.ClientToScreen(FV.hwnd, pt);
		}
		const nVerb = api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null, null);
		api.DestroyMenu(hMenu);
		Sync.EscapeUnicode.Exec(FV, nVerb);
	},

	Escape: function (Ctrl, pt) {
		let FV = Ctrl;
		if (!FV || !(FV.Type <= CTRL_EB)) {
			FV = te.Ctrl(CTRL_FV);
		}
		Sync.EscapeUnicode.Exec(FV, 1);
	},

	Unescape: function (Ctrl, pt) {
		let FV = Ctrl;
		if (!FV || !(FV.Type <= CTRL_EB)) {
			FV = te.Ctrl(CTRL_FV);
		}
		Sync.EscapeUnicode.Exec(FV, 2);
	},

	Exec: function (FV, nVerb) {
		let s = "";
		if (nVerb) {
			const Items = FV.Items();
			const List = [];
			for (let i = 0; i < Items.Count; i++) {
				const Path = Items.Item(i).Path;
				const From = fso.GetFileName(Path);
				const To = Sync.EscapeUnicode.EscapeFile(From, nVerb);
				if (!SameText(From, To)) {
					List.push([From, To, fso.GetParentFolderName(Path)].join("\0"));
				}
			}
			if (List.length) {
				const From = [];
				const To = [];
				const s = [GetText("Are you sure?")];
				for (let i in List) {
					const Data = List[i].split("\0");
					s.push(Data[0] + ' -> ' + Data[1]);
					From.push(fso.BuildPath(Data[2], Data[0]));
					To.push(fso.BuildPath(Data[2], Data[1]));
				}
				if (confirmOk(s.join("\n"))) {
					api.SHFileOperation(FO_MOVE, From.join("\0"), To.join("\0"), FOF_MULTIDESTFILES | FOF_RENAMEONCOLLISION | FOF_ALLOWUNDO | FOF_NORECURSION, false);
				}
			}
		}
	},

	EscapeFile: function (uni, nMode) {
		if (nMode == 2) {
			return unescape(uni);
		}
		const nSize = uni.length * 2 + 1;
		const Mem = api.Memory(nSize);
		Mem.Write(0, VT_LPSTR, uni);
		for (let i = 1; i < nSize; i++) {
			const c = Mem.Read(i, VT_UI1);
			if (c == 0) {
				break;
			}
			if (c == 0x5c || c == 0x7c) {
				Mem.Write(i - 1, VT_UI1, 0x5c);
			}
		}
		const ansi = Mem.Read(0, VT_LPSTR).replace(/\\./g, "?");
		const enc = new Array(uni.length);
		for (let i = uni.length; i-- > 0;) {
			const c = uni.charAt(i);
			enc[i] = (ansi.charAt(i) == c) ? c : escape(c);
		}
		return enc.join("");
	}

};

//Menu
if (item.getAttribute("MenuExec")) {
	Sync.EscapeUnicode.nPos = api.LowPart(item.getAttribute("MenuPos"));
	AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos) {
		var mii = api.Memory("MENUITEMINFO");
		mii.cbSize = mii.Size;
		mii.fMask = MIIM_STRING | MIIM_SUBMENU;
		mii.dwTypeData = Sync.EscapeUnicode.strName;
		mii.hSubMenu = api.CreatePopupMenu();
		api.InsertMenuItem(hMenu, Sync.EscapeUnicode.nPos, false, mii);
		api.InsertMenu(mii.hSubMenu, 0, MF_BYPOSITION | MF_STRING, ++nPos, GetText("Escape Unicode"));
		ExtraMenuCommand[nPos] = Sync.EscapeUnicode.Escape;
		api.InsertMenu(mii.hSubMenu, 1, MF_BYPOSITION | MF_STRING, ++nPos, GetText("Unescape Unicode"));
		ExtraMenuCommand[nPos] = Sync.EscapeUnicode.Unescape;
		return nPos;
	});
}
//Key
if (item.getAttribute("KeyExec")) {
	SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Sync.EscapeUnicode.Popup, "Func");
}
//Mouse
if (item.getAttribute("MouseExec")) {
	SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Sync.EscapeUnicode.Popup, "Func");
}
AddTypeEx("Add-ons", "Escape Unicode", Sync.EscapeUnicode.Popup);
