if (window.Addon == 1) {
	Addons.LongPress =
	{
		timeout: GetAddonOptionEx("longpress", "timeout") || 500
	};
	AddEvent("MouseMessage", function (Ctrl, hwnd, msg, wParam, pt)
	{
		if (msg == WM_LBUTTONDOWN && !g_.mouse.str) {
			setTimeout(function ()
			{
				var pt2 = api.Memory("POINT");
				api.GetCursorPos(pt2);
				if (!IsDrag(pt, pt2)) {
					g_.mouse.ptGesture = pt.Clone();
					if (g_.mouse.str == "1") {
						g_.mouse.str += '-';
						SetGestureText(Ctrl, GetGestureKey() + g_.mouse.str);
					}
				}
			}, Addons.LongPress.timeout);
		}
	});
} else {
	SetTabContents(0, "General", '<label>Timeout</label><input type="text" name="timeout" style="width: 100%" />');
}
