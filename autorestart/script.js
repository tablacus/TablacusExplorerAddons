const Addon_Id = "autorestart";
const item = await GetAddonElement(Addon_Id);

if (window.Addon == 1) {
	Addons.AutoRestart = {
		tid: null,
		time: new Date().getTime() - 10000,
		Interval: (GetNum(item.getAttribute("hour")) * 60 + GetNum(item.getAttribute("min"))) * 60000,

		Exec: function () {
			const t = new Date().getTime();
			if (t - Addons.AutoRestart.time > 10000) {
				Addons.AutoRestart.time = t;
				if (Addons.AutoRestart.tid) {
					clearTimeout(Addons.AutoRestart.tid);
				}
				Addons.AutoRestart.tid = setTimeout(async function () {
					if (await te.CmdShow != SW_SHOWNOACTIVATE && !await api.IsZoomed(ui_.hwnd) && !await api.IsChild(ui_.hwnd, await api.GetFocus())) {
						te.CmdShow = SW_SHOWNOACTIVATE;
						te.Data.bSaveConfig = true;
					}
					await FinalizeUI();
					te.Reload(true);
				}, Addons.AutoRestart.Interval);
			}
		}
	};
	if (Addons.AutoRestart.Interval >= 60000) {
		AddEvent("MouseMessage", Addons.AutoRestart.Exec, true);
		AddEvent("KeyMessage", Addons.AutoRestart.Exec, true);
		window.addEventListener("keydown", Addons.AutoRestart.Exec);
		window.addEventListener("mouseover", Addons.AutoRestart.Exec);
	}
} else {
	SetTabContents(0, "General", '<table><td><input type="text" name="hour" style="width: 3em">:<input type="text" name="min" style="width: 3em"></td><td></td></tr></table>');
}
