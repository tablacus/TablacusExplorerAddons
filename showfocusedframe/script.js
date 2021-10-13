if (window.Addon == 1) {
	Addons.ShowFocusedFrame = {
		Exec: async function (Ctrl) {
			const hList = await Ctrl.hwndList;
			if (hList) {
				api.PostMessage(hList, WM_KEYDOWN, VK_CLEAR, 0);
				api.PostMessage(hList, WM_KEYUP, VK_CLEAR, 0);
			}
		}
	}
	AddEvent("NavigateComplete", Addons.ShowFocusedFrame.Exec);

	AddEvent("KeyMessage", function (Ctrl, hwnd, msg, key, keydata) {
		if (key == VK_MENU && msg == WM_KEYUP) {
			Addons.ShowFocusedFrame.Exec(Ctrl);
		}
	}, true);
}
