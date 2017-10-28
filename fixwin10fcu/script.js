if (window.Addon == 1) {
	Addons.FixWin10FCU = {};

	AddEvent("MouseMessage", function (Ctrl, hwnd, msg, wParam, pt)
	{
		if (msg == WM_MOUSEMOVE) {
			if (api.GetKeyState(VK_LBUTTON) < 0) {
				if (pt.x == 0 || pt.y == 0 || Math.abs(pt.x - screen.width * screen.deviceXDPI / screen.logicalXDPI) < 2 || Math.abs(pt.y - screen.height * screen.deviceYDPI / screen.logicalYDPI) < 2) {
					api.SetCursorPos(Addons.FixWin10FCU.x, Addons.FixWin10FCU.y);
				} else {
					Addons.FixWin10FCU.x = pt.x;
					Addons.FixWin10FCU.y = pt.y;
				}
			}
		}
	});
}
