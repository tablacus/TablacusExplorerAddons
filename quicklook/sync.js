var Addon_Id = "quicklook";
var item = GetAddonElement(Addon_Id);

Sync.QuickLook = {
	strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
	nPos: api.LowPart(item.getAttribute("MenuPos")),
	Key: item.getAttribute("Key"),

	Exec: function (Ctrl, pt) {
		Sync.QuickLook.SendMessage(GetFolderView(Ctrl, pt), "Toggle");
		return S_OK;
	},

	ExecMenu: function (Ctrl, pt) {
		Sync.QuickLook.SendMessage(null, "Toggle", (g_.MenuSelected || {}).Path);
		return S_OK;
	},

	SendMessage: function (FV, Mode, Path) {
		if (!Path) {
			if (!FV) {
				FV = te.Ctrl(CTRL_FV);
			}
			var Items = FV.SelectedItems();
			if (!Items || !Items.Count) {
				Items = FV.Items();
			}
			if (Items && Items.Count) {
				Path = Items.Item(0).Path;
			} else {
				Path = FV.FolderItem.Path;
			}
		}
		if (Mode == "Switch" && Sync.QuickLook.Path == Path) {
			return;
		}
		Sync.QuickLook.Path = Path;
		var wfd = api.Memory("WIN32_FIND_DATA");
		var hFind = api.FindFirstFile("\\\\.\\pipe\\*", wfd);
		var strPipe;
		for (var bFind = hFind != INVALID_HANDLE_VALUE; bFind; bFind = api.FindNextFile(hFind, wfd)) {
			if (/QuickLook\.App\.Pipe\./i.test(wfd.cFileName)) {
				strPipe = wfd.cFileName;
				break;
			}
		}
		api.FindClose(hFind);
		if (strPipe) {
			var hFile = api.CreateFile(["\\\\.\\pipe\\", strPipe].join(""), 0x40000000, 0, null, 3, FILE_ATTRIBUTE_NORMAL, null);
			if (hFile == INVALID_HANDLE_VALUE) {
				return;
			}
			api.WriteFile(hFile, api.WideCharToMultiByte(65001, ["QuickLook.App.PipeMessages.", Mode, "|", Path].join("")));
			api.CloseHandle(hFile);
		}
	},

};

AddEvent("StatusText", function (Ctrl, Text, iPart) {
	if (Ctrl.Path || Ctrl.Type <= CTRL_EB && Text) {
		var hwnd = api.GetTopWindow(null);
		do {
			if (api.PathMatchSpec(api.GetClassName(hwnd), "*QuickLook*")) {
				if (api.IsWindowVisible(hwnd)) {
					Sync.QuickLook.SendMessage(Ctrl, "Switch", Ctrl.Path);
					break;
				}
			}
		} while (hwnd = api.GetWindow(hwnd, GW_HWNDNEXT));
	}
});

AddEvent("ToolTip", function (Ctrl, Index) {
	if (Ctrl.Type == CTRL_SB && Index >= 0) {
		var Item = Ctrl.Item(Index);
		if (Item) {
			var hwnd = api.GetTopWindow(null);
			do {
				if (api.PathMatchSpec(api.GetClassName(hwnd), "*QuickLook*")) {
					if (api.IsWindowVisible(hwnd)) {
						Sync.QuickLook.SendMessage(Ctrl, "Switch", Item.Path);
						break;
					}
				}
			} while (hwnd = api.GetWindow(hwnd, GW_HWNDNEXT));
		}
	}
}, true);

//Menu
if (item.getAttribute("MenuExec")) {
	AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos) {
		api.InsertMenu(hMenu, Sync.QuickLook.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Sync.QuickLook.strName);
		ExtraMenuCommand[nPos] = Sync.QuickLook.Exec;
		return nPos;
	});
}
//Key
if (item.getAttribute("KeyExec")) {
	SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Sync.QuickLook.Exec, "Func");
	SetKeyExec("Menus", item.getAttribute("Key"), Sync.QuickLook.ExecMenu, "Func");
}
//Mouse
if (item.getAttribute("MouseExec")) {
	SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Sync.QuickLook.Exec, "Func");
}

AddTypeEx("Add-ons", "QuickLook", Sync.QuickLook.Exec);
