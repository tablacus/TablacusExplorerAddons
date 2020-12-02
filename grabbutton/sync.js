AddEvent("MouseMessage", function (Ctrl, hwnd, msg, wParam, pt) {
	if (Common.GrabButton.Capture) {
		if (msg == WM_LBUTTONUP || api.GetKeyState(VK_LBUTTON) >= 0) {
			api.ReleaseCapture();
			Common.GrabButton.Capture = false;
		} else {
			if (api.IsZoomed(te.hwnd)) {
				if (IsDrag(pt, Common.GrabButton.pt)) {
					const rcZoomed = api.Memory("RECT");
					api.GetWindowRect(te.hwnd, rcZoomed);
					api.ReleaseCapture();
					api.SendMessage(te.hwnd, WM_SYSCOMMAND, SC_RESTORE, 0);
					api.SetCapture(te.hwnd);
					const rc = api.Memory("RECT");
					api.GetWindowRect(te.hwnd, rc);
					const w = rc.right - rc.left;
					const h = rc.bottom - rc.top;
					const x = pt.x - (pt.x - rcZoomed.Left) * (w / (rcZoomed.right - rcZoomed.left));
					const y = pt.y - (pt.y - rcZoomed.top) * (h / (rcZoomed.bottom - rcZoomed.top));
					api.MoveWindow(te.hwnd, x, y, rc.right - rc.left, rc.bottom - rc.top, true);
					Common.GrabButton.pt = pt.Clone();
				}
				return S_OK;
			}
			const dx = pt.x - Common.GrabButton.pt.x;
			const dy = pt.y - Common.GrabButton.pt.y;
			if (dx || dy) {
				const rc = api.Memory("RECT");
				api.GetWindowRect(te.hwnd, rc);
				api.MoveWindow(te.hwnd, rc.left + dx, rc.top + dy, rc.right - rc.left, rc.bottom - rc.top, true);
			}
			Common.GrabButton.pt = pt.Clone();
		}
		return S_OK;
	}
}, true);
