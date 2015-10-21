Addon_Id = "regexpincsearch";

if (window.Addon == 1) {
	Addons.RegExpIncSearch =
	{
		str: "",
		tid: null,
		Timeout: api.LowPart(Option(Addon_Id, "Timeout")) || 2000,
		ErrMsg: (api.LoadString(api.GetModuleHandle(fso.BuildPath(system32, "shell32.dll")), 6456) || "%s").replace("%1!ls!", "%s"),

		Search: function ()
		{
			if (Addons.RegExpIncSearch.str) {
				if (!Addons.RegExpIncSearch.SearchEx(0, 1)) {
					var re;
					var FV = te.Ctrl(CTRL_FV);
					var hwnd = FV.hwndList;
					if (hwnd) {
						var nIndex = -1;
						var c0 = Addons.RegExpIncSearch.str.charAt(0);
						var lvfi = api.Memory("LVFINDINFO");
						lvfi.flags = LVFI_STRING;
						lvfi.psz = c0;
						for (var i = 0; i < Addons.RegExpIncSearch.str.length; i++) {
							var c = Addons.RegExpIncSearch.str.charAt(i);
							if (c != c0) {
								nIndex = -1;
								break;
							}
							var n = api.SendMessage(hwnd, LVM_FINDITEM, nIndex, lvfi);
							nIndex = n >= 0 ? n : api.SendMessage(hwnd, LVM_FINDITEM, -1, lvfi);
						}
						re = nIndex >= 0;
					} else {
						Addons.RegExpIncSearch.nIndex = -1;
						var c = Addons.RegExpIncSearch.str.charAt(0);
						re = new RegExp("^" + c, "i");
						if (Addons.RegExpIncSearch.SearchEx(0, 1, re)) {
							var nBase = Addons.RegExpIncSearch.nIndex;
							for (var i = 1; i < Addons.RegExpIncSearch.str.length; i++) {
								if (c != Addons.RegExpIncSearch.str.charAt(i)) {
									re = null;
									break;
								}
								if (!Addons.RegExpIncSearch.SearchEx(Addons.RegExpIncSearch.nIndex + 1, 1, re)) {
									Addons.RegExpIncSearch.nIndex = nBase;
								}
							}
							nIndex = Addons.RegExpIncSearch.nIndex;
						} else {
							re = null;
						}
					}
					if (re) {
						FV.SelectItem(nIndex, SVSI_SELECT | SVSI_FOCUSED | SVSI_ENSUREVISIBLE | SVSI_DESELECTOTHERS);
					} else {
						ShowStatusText(te.Ctrl(CTRL_FV), api.sprintf(999, Addons.RegExpIncSearch.ErrMsg, Addons.RegExpIncSearch.str));
						Addons.RegExpIncSearch.Clear(true);
					}
				}
			}
		},

		SearchEx: function (i, iDir, re)
		{
			var bFocus = !re;
			if (bFocus) {
				try {
					re = new RegExp((window.migemo && migemo.query(Addons.RegExpIncSearch.str)) || Addons.RegExpIncSearch.str, "i");
				} catch (e) {
					return false;
				}
			}
			var FV = te.Ctrl(CTRL_FV);
			var Items = FV.Items();
			var nCount = Items.Count;
			while (i >= 0 && i < nCount) {
				var pid = Items.Item(i);
				if (re.test(pid.Name)) {
					if (bFocus) {
						FV.SelectItem(pid, SVSI_SELECT | SVSI_FOCUSED | SVSI_ENSUREVISIBLE | SVSI_DESELECTOTHERS);
					}
					Addons.RegExpIncSearch.nIndex = i;
					return true;
				}
				i += iDir;
			}
			return false;
		},

		Clear: function (bNoStatus)
		{
			Addons.RegExpIncSearch.time = null;
			Addons.RegExpIncSearch.str = "";
			Addons.RegExpIncSearch.nIndex = -1;
			if (!bNoStatus) {
				ShowStatusText(te.Ctrl(CTRL_FV), "");
			}
		}
	};

	AddEvent("KeyMessage", function (Ctrl, hwnd, msg, key, keydata)
	{
		if (msg == WM_CHAR) {
			var strClass = api.GetClassName(hwnd);
			if (api.PathMatchSpec(strClass, [WC_LISTVIEW, "DirectUIHWND"].join(";"))) {
				if (key == VK_ESCAPE) {
					Addons.RegExpIncSearch.Clear();
					return S_OK;
				}
				var time = new Date().getTime();
				if (Addons.RegExpIncSearch.str && time - Addons.RegExpIncSearch.time > Addons.RegExpIncSearch.Timeout) {
					if (String.fromCharCode(key) != Addons.RegExpIncSearch.str.charAt(Addons.RegExpIncSearch.str.length - 1)) {
						Addons.RegExpIncSearch.Clear();
					}
				}
				Addons.RegExpIncSearch.time = time;
				Addons.RegExpIncSearch.str += String.fromCharCode(key);
				clearTimeout(Addons.RegExpIncSearch.tid);
				Addons.RegExpIncSearch.tid = setTimeout(Addons.RegExpIncSearch.Search, 200);
				ShowStatusText(Ctrl, Addons.RegExpIncSearch.str);
				return S_OK;
			} else {
				Addons.RegExpIncSearch.Clear();
			}
		} else if (msg == WM_SYSCHAR) {
			Addons.RegExpIncSearch.str.Clear();
		} else if (msg == WM_KEYDOWN) {
			if (Addons.RegExpIncSearch.nIndex >= 0) {
				if (key >= VK_END && key <= VK_DOWN) {
					Addons.RegExpIncSearch.Clear();
				} else if (key == VK_NEXT) {
					Addons.RegExpIncSearch.SearchEx(Addons.RegExpIncSearch.nIndex + 1, 1);
					return S_OK;
				} else if (key == VK_PRIOR) {
					Addons.RegExpIncSearch.SearchEx(Addons.RegExpIncSearch.nIndex - 1, -1);
					return S_OK;
				}
			}
		}
	});

	AddEvent("NavigateComplete", Addons.RegExpIncSearch.Clear);
} else {
	document.getElementById("tab0").value = GetText("General");
	document.getElementById("panel0").innerHTML = '<label>Timeout</label><br /><table style="width: 100%"><tr><td style="width: 100%"><input type="text" id="Timeout" style="width: 6em; text-align:right" />ms</td><td><input type="button" value="Set Default" onclick="document.F.Timeout.value=\'\'" /></td></tr></table>';
}
