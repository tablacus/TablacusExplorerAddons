var Addon_Id = "grabbutton";
var Default = "ToolBar1Left";

var item = GetAddonElement(Addon_Id);

if (window.Addon == 1) {
	Addons.GrabButton =
	{
		Grab: function ()
		{
			if (event.button < 2 && !api.IsZoomed(te.hwnd)) {
				Addons.GrabButton.pt = api.Memory("POINT");
				api.GetCursorPos(Addons.GrabButton.pt);
				api.SetCapture(te.hwnd);
				Addons.GrabButton.Capture = true;
			}
		},

		Popup: function (o)
		{
			wsh.SendKeys("% ");
		}
	};

	AddEvent("MouseMessage", function (Ctrl, hwnd, msg, wParam, pt)
	{
		if (Addons.GrabButton.Capture) {
			if (msg == WM_LBUTTONUP || api.GetKeyState(VK_LBUTTON) >= 0) {
				api.ReleaseCapture();
				Addons.GrabButton.Capture = false;
			} else {
				var dx = pt.X - Addons.GrabButton.pt.X;
				var dy = pt.Y - Addons.GrabButton.pt.Y;
				if (dx || dy) {
					var rc = api.Memory("RECT");
					api.GetWindowRect(te.hwnd, rc);
					api.MoveWindow(te.hwnd, rc.Left + dx, rc.Top + dy, rc.Right - rc.Left, rc.Bottom - rc.Top, true);
				}
				Addons.GrabButton.pt = pt.Clone();
			}
			return S_OK;
		}
	}, true);

	var h = item.getAttribute("IconSize") || "16pt";
	var src = item.getAttribute("Icon") || "icon:" + api.GetModuleFileName(null) + ",0";
	if (src) {
		src = '<img src="' + EncodeSC(src) + '"';
		if (h) {
			h = Number(h) ? h + 'px' : EncodeSC(h);
			src += ' width="' + h + '" height="' + h + '"';
		}
		src += '>';
	}
	SetAddon(Addon_Id, Default, ['<span class="button" onmousedown="Addons.GrabButton.Grab()" oncontextmenu="Addons.GrabButton.Popup(this); return false">' ,src ,'</span>']);
}
