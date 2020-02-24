var Addon_Id = "grabbar";
var Default = "ToolBar1Center";

if (window.Addon == 1) {
	Addons.GrabBar =
	{
		Grab: function () {
			if (event.button < 2 && !api.IsZoomed(te.hwnd)) {
				Addons.GrabBar.pt = api.Memory("POINT");
				api.GetCursorPos(Addons.GrabBar.pt);
				api.SetCapture(te.hwnd);
				Addons.GrabBar.Capture = true;
			}
		},

		Popup: function () {
			var pt = api.Memory("POINT");
			api.GetCursorPos(pt);
			api.PostMessage(te.hwnd, 0x313, 0, pt.x + (pt.y << 16));
			return false;
		}
	};

	AddEvent("MouseMessage", function (Ctrl, hwnd, msg, wParam, pt) {
		if (Addons.GrabBar.Capture) {
			if (msg == WM_LBUTTONUP || api.GetKeyState(VK_LBUTTON) >= 0) {
				api.ReleaseCapture();
				Addons.GrabBar.Capture = false;
			} else {
				var dx = pt.X - Addons.GrabBar.pt.X;
				var dy = pt.Y - Addons.GrabBar.pt.Y;
				if (dx || dy) {
					var rc = api.Memory("RECT");
					api.GetWindowRect(te.hwnd, rc);
					api.MoveWindow(te.hwnd, rc.Left + dx, rc.Top + dy, rc.Right - rc.Left, rc.Bottom - rc.Top, true);
				}
				Addons.GrabBar.pt = pt.Clone();
			}
			return S_OK;
		}
	}, true);

	AddEvent("ChangeView", function (Ctrl) {
		try {
			setTimeout(function () {
				if (Ctrl.Id == Ctrl.Parent.Selected.Id && Ctrl.Parent.Id == te.Ctrl(CTRL_TC).Id) {
					document.getElementById("grabbar").innerText = Ctrl.Title + ' - Tablacus Explorer';
				}
			}, 99);
		} catch (e) { }
	});

	SetAddon(Addon_Id, Default, ['<div id="grabbar" onmousedown="Addons.GrabBar.Grab()" oncontextmenu="return Addons.GrabBar.Popup(this)" style="width: 100%; cursor : default; text-align: center; padding: 2pt; white-space: nowrap; overflow: hidden; text-overflow: ellipsis"></div>']);
}
