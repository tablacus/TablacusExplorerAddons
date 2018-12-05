var Addon_Id = "hidetitlebar";
var Default = "None";

var item = GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.HideTitleBar = {
		Enabled: true,
		strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,

		Set: function ()
		{
			var dwStyle = api.GetWindowLongPtr(te.hwnd, GWL_STYLE);
			var dwStyle0 = dwStyle;
		   	if (Addons.HideTitleBar.Enabled) {
				dwStyle &= ~WS_CAPTION;
			} else {
				dwStyle |= WS_CAPTION;
			}
			if (dwStyle != dwStyle0) {
				api.SetWindowLongPtr(te.hWnd, GWL_STYLE, dwStyle);
				var rc = api.Memory("RECT");
				api.GetWindowRect(te.hwnd, rc);
				api.MoveWindow(te.hwnd, rc.left, rc.top, rc.right - rc.Left, rc.bottom - rc.top - 1, false);
				api.MoveWindow(te.hwnd, rc.left, rc.top, rc.right - rc.Left, rc.bottom - rc.top, false);
			}
			Addons.HideTitleBar.Resize();
		},

		Exec: function ()
		{
			Addons.HideTitleBar.Enabled = !Addons.HideTitleBar.Enabled;
			Addons.HideTitleBar.Set();
			return S_OK;
		},

		Popup: function ()
		{
			return false;
		},

		Resize: function()
		{
			if (Addons.HideTitleBar.Enabled && api.IsZoomed(te.hwnd) && !document.msFullscreenElement) {
				var rc = api.Memory("RECT");
				api.GetWindowRect(te.hwnd, rc);
				var pt = {x: (rc.left + rc.right) / 2, y: (rc.top + rc.bottom)};
				if (!api.MonitorFromPoint(pt, MONITOR_DEFAULTTONULL)) {
					var hMonitor = api.MonitorFromPoint(pt, MONITOR_DEFAULTTOPRIMARY);
					var mi = api.Memory("MONITORINFOEX");
					mi.cbSize = mi.Size;
					api.GetMonitorInfo(hMonitor, mi);
					var h = mi.rcWork.top + mi.rcWork.bottom - rc.top * 2;
					api.MoveWindow(te.hwnd, rc.left, rc.top, rc.right - rc.Left, h, true);
				}
			}
		}
	};

	AddEvent("Resize", Addons.HideTitleBar.Resize);
	AddEvent("Load", Addons.HideTitleBar.Set);

	AddEventId("AddonDisabledEx", Addon_Id, function ()
	{
		Addons.HideTitleBar.Enabled = false;
		Addons.HideTitleBar.Set();
	});

	//Menu
	if (item.getAttribute("MenuExec")) {
		Addons.HideTitleBar.nPos = api.LowPart(item.getAttribute("MenuPos"));
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
		{
			api.InsertMenu(hMenu, Addons.HideTitleBar.nPos, MF_BYPOSITION | MF_STRING | (Addons.HideTitleBar.Enabled ? MF_CHECKED : 0), ++nPos, Addons.HideTitleBar.strName);
			ExtraMenuCommand[nPos] = Addons.HideTitleBar.Exec;
			return nPos;
		});
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.HideTitleBar.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.HideTitleBar.Exec, "Func");
	}
	//Type
	AddTypeEx("Add-ons", "Hide Tool bar", Addons.HideTitleBar.Exec);

	var h = GetAddonOption(Addon_Id, "IconSize") || window.IconSize || 24;
	var s = GetAddonOption(Addon_Id, "Icon");
	if (s) {
		s = '<img title="' + EncodeSC(Addons.HideTitleBar.strName) + '" src="' + EncodeSC(s) + '" width="' + h + 'px" height="' + h + 'px" />';
	}
	else {
		s = EncodeSC(Addons.HideTitleBar.strName);
	}
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.HideTitleBar.Exec();" oncontextmenu="return Addons.HideTitleBar.Popup()" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', s, '</span>']);
}
