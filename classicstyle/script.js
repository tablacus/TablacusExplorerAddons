if (window.Addon == 1) {
	Addons.ClassicStyle =
	{
		SetTheme: function (Ctrl)
		{
			Addons.ClassicStyle.SetTheme1(Ctrl, api.ShouldAppsUseDarkMode() ? "darkmode_explorer" : null);
		},

		SetTheme1: function (FV, s)
		{
			if (FV.hwndList) {
				api.SetWindowTheme(FV.hwndList, s, null);
			}
		},

		SetThemeAll: function(s)
		{
			var cFV = te.Ctrls(CTRL_FV);
			for (var i in cFV) {
				Addons.ClassicStyle.SetTheme1(cFV[i], s);
			}
		}
	};

	AddEvent("ViewCreated", Addons.ClassicStyle.SetTheme);

	AddEventId("AddonDisabledEx", "classicstyle", function ()
	{
		Addons.ClassicStyle.SetThemeAll("explorer");
	});

	Addons.ClassicStyle.SetThemeAll(api.ShouldAppsUseDarkMode() ? "darkmode_explorer" : null);
}
