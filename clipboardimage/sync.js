Sync.ClipboardImage = {
	String: api.LoadString(hShell32, 33562) || "&Paste",

	Exec: function (Ctrl, pt) {
		var Items = api.OleGetClipboard()
		if (Items.Count) {
			return;
		}
		var image = api.CreateObject("WICBitmap").FromClipboard();
		var FV = GetFolderView(Ctrl);
		var DropTarget = FV.DropTarget;
		if (image && DropTarget) {
			var temp = BuildPath(fso.GetSpecialFolder(2).Path, "tablacus");
			CreateFolder2(temp);
			var dt = new Date().getTime();
			var file = api.GetDateFormat(LOCALE_USER_DEFAULT, 0, dt, "yyyyMMdd") + "_" + api.GetTimeFormat(LOCALE_USER_DEFAULT, 0, dt, "HHmmss") + ".png";
			image.Save(BuildPath(temp, file));
			DropTarget.Drop(BuildPath(temp, file), MK_LBUTTON | MK_SHIFT, api.Memory("POINT"), [DROPEFFECT_MOVE | DROPEFFECT_COPY], false, FV);
			return S_OK;
		}
	}
};

AddEvent("Command", function (Ctrl, hwnd, msg, wParam, lParam) {
	if (Ctrl.Type <= CTRL_EB || Ctrl.Type == CTRL_TV) {
		if ((wParam & 0xfff) + 1 == CommandID_PASTE) {
			return Sync.ClipboardImage.Exec(Ctrl);
		}
	}
}, true);

AddEvent("InvokeCommand", function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon) {
	if (Verb + 1 == CommandID_PASTE) {
		return Sync.ClipboardImage.Exec(ContextMenu.FolderView);
	}
}, true);

AddEvent("Menus", function (Ctrl, hMenu, nPos, Selected, SelItem, ContextMenu, Name, pt) {
	if (/Background|Edit/i.test(Name) && (api.IsClipboardFormatAvailable(2))) {
		var mii = api.Memory("MENUITEMINFO");
		mii.cbSize = mii.Size;
		mii.fMask = MIIM_ID | MIIM_STATE;
		for (var i = api.GetMenuItemCount(hMenu); i-- > 0;) {
			api.GetMenuItemInfo(hMenu, i, true, mii);
			if (mii.fState & MFS_DISABLED) {
				var s = api.GetMenuString(hMenu, i, MF_BYPOSITION);
				if (s && s.indexOf(Sync.ClipboardImage.String) == 0) {
					api.EnableMenuItem(hMenu, i, MF_ENABLED | MF_BYPOSITION);
					ExtraMenuCommand[mii.wID] = Sync.ClipboardImage.Exec;
				}
			}
		}
	}
	return nPos;
});
