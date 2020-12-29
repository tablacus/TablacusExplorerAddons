const Addon_Id = "regexpincsearch";

Sync.RegExpIncSearch = {
	str: "",
	Timeout: GetAddonOptionEx(Addon_Id, "Timeout") || 2000,
	ErrMsg: (api.LoadString(api.GetModuleHandle(fso.BuildPath(system32, "shell32.dll")), 6456) || "%s").replace("%1!ls!", "%s"),

	Search: function () {
		if (Sync.RegExpIncSearch.str && Sync.RegExpIncSearch.str != '^') {
			if (!Sync.RegExpIncSearch.SearchEx(0, 1)) {
				let re;
				const FV = te.Ctrl(CTRL_FV);
				const hwnd = FV.hwndList;
				if (hwnd) {
					let nIndex = -1;
					const c0 = Sync.RegExpIncSearch.str.charAt(0);
					const lvfi = api.Memory("LVFINDINFO");
					lvfi.flags = LVFI_STRING;
					lvfi.psz = c0;
					for (let i = 0; i < Sync.RegExpIncSearch.str.length; i++) {
						const c = Sync.RegExpIncSearch.str.charAt(i);
						if (c != c0) {
							nIndex = -1;
							break;
						}
						const n = api.SendMessage(hwnd, LVM_FINDITEM, nIndex, lvfi);
						nIndex = n >= 0 ? n : api.SendMessage(hwnd, LVM_FINDITEM, -1, lvfi);
					}
					re = nIndex >= 0;
				} else {
					Sync.RegExpIncSearch.nIndex = -1;
					const c = Sync.RegExpIncSearch.str.charAt(0);
					re = new RegExp("^" + c, "i");
					if (Sync.RegExpIncSearch.SearchEx(0, 1, re)) {
						const nBase = Sync.RegExpIncSearch.nIndex;
						for (let i = 1; i < Sync.RegExpIncSearch.str.length; i++) {
							if (c != Sync.RegExpIncSearch.str.charAt(i)) {
								re = null;
								break;
							}
							if (!Sync.RegExpIncSearch.SearchEx(Sync.RegExpIncSearch.nIndex + 1, 1, re)) {
								Sync.RegExpIncSearch.nIndex = nBase;
							}
						}
						nIndex = Sync.RegExpIncSearch.nIndex;
					} else {
						re = null;
					}
				}
				if (re) {
					FV.SelectItem(nIndex, SVSI_SELECT | SVSI_FOCUSED | SVSI_ENSUREVISIBLE | SVSI_DESELECTOTHERS);
				} else {
					ShowStatusText(te.Ctrl(CTRL_FV), api.sprintf(999, Sync.RegExpIncSearch.ErrMsg, Sync.RegExpIncSearch.str));
					Sync.RegExpIncSearch.Clear(true);
				}
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
