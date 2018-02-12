if (window.Addon == 1) {
	Addons.AutoRestart = {
		tid: null,
		time: new Date().getTime() - 10000,
		Interval: (GetAddonOptionEx("autorestart", "hour") * 60 + GetAddonOptionEx("autorestart", "min")) * 60000,
		Exec: function ()
		{
			var t = new Date().getTime();
			if (t - Addons.AutoRestart.time > 10000) {
				Addons.AutoRestart.time = t;
				if (Addons.AutoRestart.tid) {
					clearTimeout(Addons.AutoRestart.tid);
				}
				Addons.AutoRestart.tid = setTimeout(function ()
				{
					if (te.CmdShow != SW_SHOWNOACTIVATE && !api.IsZoomed(te.hwnd) && !api.IsChild(te.hwnd, api.GetFocus())) {
						te.CmdShow = SW_SHOWNOACTIVATE;
						te.Data.bSaveConfig = true;
					}
					SaveConfig();
					te.Reload(true);
				}, Addons.AutoRestart.Interval);
			}
		}
	};
	if (Addons.AutoRestart.Interval >= 60000) {
		AddEvent("MouseMessage", Addons.AutoRestart.Exec, true);
		AddEvent("KeyMessage", Addons.AutoRestart.Exec, true);
	}
} else {
	SetTabContents(0, "General", '<table><td><input type="text" name="hour" style="width: 3em" />:<input type="text" name="min" style="width: 3em" /></td><td></td></tr></table>');
}
