Sync.LongPress = {
	timeout: GetAddonOptionEx("longpress", "timeout") || 500
};
AddEvent("MouseMessage", function (Ctrl, hwnd, msg, wParam, pt) {
	if (msg == WM_LBUTTONDOWN && !g_.mouse.str) {
		setTimeout(function () {
			const pt2 = api.Memory("POINT");
			api.GetCursorPos(pt2);
			if (!IsDrag(pt, pt2)) {
				g_.mouse.ptGesture = pt.Clone();
				const str = g_.mouse.str;
				if (str == "1") {
					g_.mouse.str = str + '-';
					SetGestureText(Ctrl, GetGestureKey() + g_.mouse.str);
				}
			}
		}, Sync.LongPress.timeout);
	}
});
