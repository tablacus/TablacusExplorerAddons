if (window.Addon == 1) {
	Addons.AutoUpdate = {
		checked: 0,
		CONFIG: fso.BuildPath(te.Data.DataFolder, "config\\autoupdate.txt"),

		Exec: function ()
		{
			if (Addons.AutoUpdate.tid) {
				clearTimeout(Addons.AutoUpdate.tid);
			}
			var t = Addons.AutoUpdate.Day - new Date().getTime() + Addons.AutoUpdate.checked;
			if (t <= 0) {
				Addons.AutoUpdate.tid = setTimeout(function ()
				{
					if (Addons.AutoUpdate.Day - new Date().getTime() + Addons.AutoUpdate.checked <= 0) {
						Addons.AutoUpdate.checked = new Date().getTime();
						Addons.AutoUpdate.bSave = true;
						CheckUpdate({ silent: true, noconfirm: GetAddonOptionEx("autoupdate", "auto") });
					}
				}, Addons.AutoUpdate.Interval);
			} else {
				Addons.AutoUpdate.tid = setTimeout(Addons.AutoUpdate.Exec, t < 60000 ? 60000 : t);
			}
		}
	};
	var smhdw = { m: 1, h:60 };
	Addons.AutoUpdate.Day = GetAddonOptionEx("autoupdate", "day") * 86400000 - 900000;
	if (Addons.AutoUpdate.Day < 86400000 - 900000) {
		Addons.AutoUpdate.Day = 86400000 - 900000;
	}
	Addons.AutoUpdate.Interval = ((GetAddonOption("autoupdate", "background") || "10m").replace(/([\dx]+)([mh])/ig, function (all, re1, re2)
	{
		return eval(re1.replace(/x/ig, "*")) * smhdw[re2.toLowerCase()] + '+';
	}).replace(/\+$/, "")) * 60000;

	if (Addons.AutoUpdate.Interval < 60000) {
		Addons.AutoUpdate.Interval = 60000;
	}
	AddEvent("MouseMessage", Addons.AutoUpdate.Exec, true);
	AddEvent("KeyMessage", Addons.AutoUpdate.Exec, true);
	AddEvent("SaveConfig", function ()
	{
		if (Addons.AutoUpdate.bSave) {
			try {
				var ado = te.CreateObject(api.ADBSTRM);
				ado.CharSet = "utf-8";
				ado.Open();
				ado.WriteText(new Date(Addons.AutoUpdate.checked).toUTCString());
				ado.SaveToFile(Addons.AutoUpdate.CONFIG, adSaveCreateOverWrite);
				ado.Close();
				Addons.AutoUpdate.bSave = false;
			} catch (e) {}
		}
	});
	try {
		var ado = te.CreateObject(api.ADBSTRM);
		ado.CharSet = "utf-8";
		ado.Open();
		ado.LoadFromFile(Addons.AutoUpdate.CONFIG);
		Addons.AutoUpdate.checked = new Date(ado.ReadText(adReadLine)).getTime();
		ado.Close();
	} catch (e) {}
	Addons.AutoUpdate.Exec();
} else {
	SetTabContents(0, "General", '<label>@shell32.dll,-34830[Day]</label><br /><input type="text" name="day" /><br /><label>Background</label><br /><input type="text" name="background" placeholder="time 1m 1h" title="time 1m 1h" /><br /><br /><input type="checkbox" id="auto" /><label for="auto">Auto</label>');
}
