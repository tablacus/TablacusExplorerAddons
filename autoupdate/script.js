if (window.Addon == 1) {
	const Addon_Id = "autoupdate";
	const item = await GetAddonElement(Addon_Id);

	Addons.AutoUpdate = {
		checked: 0,
		CONFIG: BuildPath(ui_.DataFolder, "config\\autoupdate.txt"),
		args: api.CreateObject("Object"),

		Exec: async function () {
			if (Addons.AutoUpdate.tid) {
				clearTimeout(Addons.AutoUpdate.tid);
			}
			const t = Addons.AutoUpdate.Day - new Date().getTime() + Addons.AutoUpdate.checked;
			if (t <= 0) {
				Addons.AutoUpdate.tid = setTimeout(function () {
					if (Addons.AutoUpdate.Day - new Date().getTime() + Addons.AutoUpdate.checked <= 0) {
						Addons.AutoUpdate.checked = new Date().getTime();
						WriteTextFile(Addons.AutoUpdate.CONFIG, new Date(Addons.AutoUpdate.checked).toUTCString());
						CheckUpdate(Addons.AutoUpdate.args);
					}
				}, Addons.AutoUpdate.Interval);
			} else {
				Addons.AutoUpdate.tid = setTimeout(Addons.AutoUpdate.Exec, Math.max(t, 60000));
			}
		}
	};
	Addons.AutoUpdate.args.silent = true;
	Addons.AutoUpdate.args.noconfirm = item.getAttribute("auto");

	const smhdw = { m: 1, h: 60 };
	Addons.AutoUpdate.Day = Math.max(86400000 - 900000, GetNum(item.getAttribute("day")) * 86400000 - 900000);
	Addons.AutoUpdate.Interval = Math.max(60000, ((item.getAttribute("background") || "10m").replace(/([\dx]+)([mh])/ig, function (all, re1, re2) {
		return eval(re1.replace(/x/ig, "*")) * smhdw[re2.toLowerCase()] + '+';
	}).replace(/\+$/, "")) * 60000);

	AddEvent("MouseMessage", Addons.AutoUpdate.Exec, true);
	AddEvent("KeyMessage", Addons.AutoUpdate.Exec, true);

	const s = await ReadTextFile(Addons.AutoUpdate.CONFIG);
	if (s) {
		Addons.AutoUpdate.checked = new Date(s).getTime();
	}
	Addons.AutoUpdate.Exec();
} else {
	SetTabContents(0, "General", '<label>@shell32.dll,-34830[Day]</label><br><input type="text" name="day"><br><label>Background</label><br><input type="text" name="background" placeholder="time 1m 1h" title="time 1m 1h"><br><br><input type="checkbox" id="auto"><label for="auto">Auto</label>');
}
