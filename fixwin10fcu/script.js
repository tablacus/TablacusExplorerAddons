if (window.Addon == 1) {
	AddEvent("MouseMessage", function (Ctrl, hwnd, msg, wParam, pt)
	{
		if (Ctrl.Type == CTRL_SB && msg == WM_MOUSEMOVE) {
			if (api.GetKeyState(VK_LBUTTON) < 0 || api.GetKeyState(VK_RBUTTON) < 0) {
				api.RedrawWindow(Ctrl.hwnd, null, 0, RDW_NOERASE | RDW_INVALIDATE);
			}
		}
	});
}
