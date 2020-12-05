AddEvent("KeyMessage", function (Ctrl, hwnd, msg, key, keydata) {
	if (key == VK_PROCESSKEY && msg == WM_KEYDOWN) {
		if (api.PathMatchSpec(api.GetClassName(hwnd), [WC_LISTVIEW, WC_TREEVIEW, "DirectUIHWND"].join(";"))) {
			const hImc = api.ImmGetContext(hwnd);
			if (hImc) {
				api.ImmSetOpenStatus(hImc, false);
				api.ImmReleaseContext(hwnd, hImc);
				return S_OK;
			}
		}
	}
}, true);
