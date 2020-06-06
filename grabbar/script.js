/* Grabbar Maximized */
var Addon_Id = "grabbar";
var Default = "ToolBar1Center";

if (window.Addon == 1) {
	Addons.GrabBar =
	{
		Down: function () {
			var dt = new Date().getTime();
			if (event.button < 2) {
				if (dt - Addons.GrabBar.dt < sha.GetSystemInformation("DoubleClickTime")) {
					this.bZoom = true;
					return S_OK;
				}
				Addons.GrabBar.dt = dt;
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
		},

		Click: function () {
			if (this.bZoom) {
				api.SendMessage(te.hwnd, WM_SYSCOMMAND, api.IsZoomed(te.hwnd) ? SC_RESTORE : SC_MAXIMIZE, 0);
				this.bZoom = false;
			}
		}
	};

	AddEvent("MouseMessage", function (Ctrl, hwnd, msg, wParam, pt) {
		if (Addons.GrabBar.Capture) {
			if (msg == WM_LBUTTONUP || api.GetKeyState(VK_LBUTTON) >= 0) {
				api.ReleaseCapture();
				Addons.GrabBar.Capture = false;
			} else {
				if (api.IsZoomed(te.hwnd)) {
					if (IsDrag(pt, Addons.GrabBar.pt)) {
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
						Addons.GrabBar.pt = pt.Clone();
					}
					return S_OK;
				}
				var dx = pt.x - Addons.GrabBar.pt.x;
				var dy = pt.y - Addons.GrabBar.pt.y;
				if (dx || dy) {
					var rc = api.Memory("RECT");
					api.GetWindowRect(te.hwnd, rc);
					api.MoveWindow(te.hwnd, rc.left + dx, rc.top + dy, rc.right - rc.left, rc.bottom - rc.top, true);
				}
				Addons.GrabBar.pt = pt.Clone();
			}
			return S_OK;
		}
	}, true);

	AddEvent("ChangeView", function (Ctrl) {
		if (Ctrl.Parent.Visible && Ctrl.Id == Ctrl.Parent.Selected.Id && Ctrl.Parent.Id == te.Ctrl(CTRL_TC).Id) {
			if (Addons.GrabBar.tid) {
				clearTimeout(Addons.GrabBar.tid);
			}
			Addons.GrabBar.tid = setTimeout(function () {
				delete Addons.GrabBar.tid;
				document.getElementById(Addon_Id).innerText = Ctrl.Title + ' - Tablacus Explorer';
			}, 99);
		}
	});

	SetAddon(Addon_Id, Default, ['<div id="grabbar" class="grabbar" unselectable="on" onclick="Addons.GrabBar.Click()" onmousedown="Addons.GrabBar.Down()" oncontextmenu="return Addons.GrabBar.Popup(this)" style="width: 100%; text-align: center; padding: 2pt; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: default"></div>']);
}
