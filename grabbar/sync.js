AddEvent("MouseMessage", function (Ctrl, hwnd, msg, wParam, pt) {
	if (Common.GrabBar.Capture) {
		if (msg == WM_LBUTTONUP || api.GetKeyState(VK_LBUTTON) >= 0) {
			api.ReleaseCapture();
			Common.GrabBar.Capture = false;
		} else {
			if (api.IsZoomed(te.hwnd)) {
				if (IsDrag(pt, Common.GrabBar.pt)) {
					var rcZoomed = api.Memory("RECT");
					api.GetWindowRect(te.hwnd, rcZoomed);
					api.ReleaseCapture();
					api.SendMessage(te.hwnd, WM_SYSCOMMAND, SC_RESTORE, 0);
					api.SetCapture(te.hwnd);
					var rc = api.Memory("RECT");
					api.GetWindowRect(te.hwnd, rc);
					var w = rc.right - rc.left;
					var h = rc.bottom - rc.top;
					var x = pt.x - (pt.x - rcZoomed.Left) * (w / (rcZoomed.right - rcZoomed.left));
					var y = pt.y - (pt.y - rcZoomed.top) * (h / (rcZoomed.bottom - rcZoomed.top));
					api.MoveWindow(te.hwnd, x, y, w, h, true);
					Common.GrabBar.pt = pt.Clone();
				}
				return S_OK;
			}
			var dx = pt.x - Common.GrabBar.pt.x;
			var dy = pt.y - Common.GrabBar.pt.y;
			if (dx || dy) {
				var rc = api.Memory("RECT");
				api.GetWindowRect(te.hwnd, rc);
				api.MoveWindow(te.hwnd, rc.left + dx, rc.top + dy, rc.right - rc.left, rc.bottom - rc.top, true);
			}
			Common.GrabBar.pt = pt.Clone();
		}
		return S_OK;
	}
}, true);
