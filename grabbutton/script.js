var Addon_Id = "grabbutton";
var Default = "ToolBar1Left";

var item = GetAddonElement(Addon_Id);

if (window.Addon == 1) {
	Addons.GrabButton =
	{
		Grab: function () {
			var dt = new Date().getTime();
			if (event.button < 2) {
				if (dt - Addons.GrabButton.dt < sha.GetSystemInformation("DoubleClickTime")) {
					this.bZoom = true;
					return S_OK;
				}
				Addons.GrabButton.dt = dt;
				Addons.GrabButton.pt = api.Memory("POINT");
				api.GetCursorPos(Addons.GrabButton.pt);
				api.SetCapture(te.hwnd);
				Addons.GrabButton.Capture = true;
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
		if (Addons.GrabButton.Capture) {
			if (msg == WM_LBUTTONUP || api.GetKeyState(VK_LBUTTON) >= 0) {
				api.ReleaseCapture();
				Addons.GrabButton.Capture = false;
			} else {
				if (api.IsZoomed(te.hwnd)) {
					var rcZoomed = api.Memory("RECT");
					api.GetWindowRect(te.hwnd, rcZoomed);
					api.ReleaseCapture();
					api.SendMessage(te.hwnd, WM_SYSCOMMAND, SC_RESTORE, 0);
					api.SetCapture(te.hwnd);
					var rc = api.Memory("RECT");
					api.GetWindowRect(te.hwnd, rc);
					var x = pt.x > rc.right - rc.left + rcZoomed.left ? pt.x - (rc.right - rc.left) : rcZoomed.left; 
					var y = pt.y > rc.bottom - rc.top + rcZoomed.top ? pt.y - (rc.bottom - rc.top) : rcZoomed.top; 
					api.MoveWindow(te.hwnd, x, y, rc.right - rc.left, rc.bottom - rc.top, true);
					Addons.GrabButton.pt = pt.Clone();
					return S_OK;
				}
				var dx = pt.x - Addons.GrabButton.pt.x;
				var dy = pt.y - Addons.GrabButton.pt.y;
				if (dx || dy) {
					var rc = api.Memory("RECT");
					api.GetWindowRect(te.hwnd, rc);
					api.MoveWindow(te.hwnd, rc.left + dx, rc.top + dy, rc.right - rc.left, rc.bottom - rc.top, true);
				}
				Addons.GrabButton.pt = pt.Clone();
			}
			return S_OK;
		}
	}, true);

	var src = item.getAttribute("Icon") || "icon:" + api.GetModuleFileName(null) + ",0";
	SetAddon(Addon_Id, Default, ['<span id="grabbutton" class="button" onmousedown="Addons.GrabButton.Grab()" onclick="Addons.GrabButton.Click()" oncontextmenu="return Addons.GrabButton.Popup(this)">', GetImgTag({ title: "Tablacus Explorer", src: src }, GetIconSize(item.getAttribute("IconSize"), 16)), '</span>']);
}
