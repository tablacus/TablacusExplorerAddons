const Addon_Id = "regexpincsearch";

Sync.RegExpIncSearch = {
	str: "",
	Timeout: GetAddonOptionEx(Addon_Id, "Timeout") || 2000,
	ErrMsg: (api.LoadString(api.GetModuleHandle(BuildPath(system32, "shell32.dll")), 6456) || "%s").replace("%1!ls!", "%s"),

	Search: function () {
		if (Sync.RegExpIncSearch.str && Sync.RegExpIncSearch.str != '^') {
			if (!Sync.RegExpIncSearch.SearchEx(0, 1)) {
				const FV = te.Ctrl(CTRL_FV);
				const s = api.sprintf(999, Sync.RegExpIncSearch.ErrMsg, Sync.RegExpIncSearch.str);
				ShowStatusText(FV, s);
				if (FV.ItemCount(SVGIO_SELECTION)) {
					FV.SelectItem(-1, SVSI_DESELECTOTHERS);
					setTimeout(function () {
						ShowStatusText(FV, s);
					}, 500);
				}
				Sync.RegExpIncSearch.Clear(true);
			}
		}
	},

	SearchEx: function (i, iDir, re) {
		const bFocus = !re;
		if (bFocus) {
			try {
				re = new RegExp((window.migemo && migemo.query(Sync.RegExpIncSearch.str).replace(/\\\^/g, "^")) || Sync.RegExpIncSearch.str, "i");
			} catch (e) {
				return false;
			}
		}
		const FV = te.Ctrl(CTRL_FV);
		const Items = FV.Items();
		const nCount = Items.Count;
		while (i >= 0 && i < nCount) {
			const pid = Items.Item(i);
			if (re.test(pid.Name)) {
				if (bFocus) {
					FV.SelectItem(pid, SVSI_SELECT | SVSI_FOCUSED | SVSI_ENSUREVISIBLE | SVSI_DESELECTOTHERS);
				}
				Sync.RegExpIncSearch.nIndex = i;
				return true;
			}
			i += iDir;
		}
		return false;
	},

	Clear: function (bNoStatus) {
		Sync.RegExpIncSearch.time = null;
		Sync.RegExpIncSearch.str = "";
		Sync.RegExpIncSearch.nIndex = -1;
		if (!bNoStatus) {
			ShowStatusText(te.Ctrl(CTRL_FV), "");
		}
	}
};

AddEvent("KeyMessage", function (Ctrl, hwnd, msg, key, keydata) {
	if (msg == WM_CHAR) {
		const strClass = api.GetClassName(hwnd);
		if (api.PathMatchSpec(strClass, [WC_LISTVIEW, "DirectUIHWND"].join(";"))) {
			if (key == VK_ESCAPE) {
				Sync.RegExpIncSearch.Clear();
				return;
			}
			const s = String.fromCharCode(key);
			if (s == '^') {
				Sync.RegExpIncSearch.Clear();
			} else if (!/[0-9A-Z_\$\[\]\-\\]/i.test(s) && !Sync.RegExpIncSearch.str || api.GetKeyState(VK_CONTROL) < 0) {
				return;
			}
			const time = new Date().getTime();
			if (Sync.RegExpIncSearch.str && time - Sync.RegExpIncSearch.time > Sync.RegExpIncSearch.Timeout) {
				if (s != Sync.RegExpIncSearch.str.charAt(Sync.RegExpIncSearch.str.length - 1)) {
					Sync.RegExpIncSearch.Clear();
				}
			}
			Sync.RegExpIncSearch.time = time;
			Sync.RegExpIncSearch.str += s;
			InvokeUI("Addons.RegExpIncSearch.Timer");
			ShowStatusText(Ctrl, Sync.RegExpIncSearch.str);
			return S_OK;
		} else {
			Sync.RegExpIncSearch.Clear();
		}
	} else if (msg == WM_SYSCHAR) {
		Sync.RegExpIncSearch.Clear();
	} else if (msg == WM_KEYDOWN) {
		if (Sync.RegExpIncSearch.nIndex >= 0) {
			if (key >= VK_END && key <= VK_DOWN) {
				Sync.RegExpIncSearch.Clear();
			} else if (key == VK_NEXT) {
				Sync.RegExpIncSearch.SearchEx(Sync.RegExpIncSearch.nIndex + 1, 1);
				return S_OK;
			} else if (key == VK_PRIOR) {
				Sync.RegExpIncSearch.SearchEx(Sync.RegExpIncSearch.nIndex - 1, -1);
				return S_OK;
			}
		}
	}
});

AddEvent("NavigateComplete", Sync.RegExpIncSearch.Clear);
