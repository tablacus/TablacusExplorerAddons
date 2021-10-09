if (window.Addon == 1) {
	AddEvent("NavigateComplete", function (Ctrl) {
		Promise.all([Ctrl.hwndList, api.GetFocus(), api.GetKeyState(VK_SHIFT)]).then(function (r) {
			if (r[0] && r[0] == r[1] && r[2] >= 0) {
				api.PostMessage(r[0], WM_KEYDOWN, VK_SHIFT, 0);
				api.PostMessage(r[0], WM_KEYUP, VK_SHIFT, 0);
			}
		});
	});
}
