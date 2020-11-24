if (window.Addon == 1) {
	Addons.ClassicStyle = {
		SetTheme: async function(Ctrl, s) {
			var hwnd = await Ctrl.hwndList;
			if (hwnd) {
				api.SetWindowTheme(hwnd, s || null, null);
			}
		},

		SetThemeAll: async function (s) {
			var cFV = await te.Ctrls(CTRL_FV);
			for (var i = await cFV.Count; --i >= 0;) {
				Addons.ClassicStyle.SetTheme(await cFV[i], s);
			}
		}
	};

	AddEvent("ListViewCreated", Addons.ClassicStyle.SetTheme);

	AddEventId("AddonDisabledEx", "classicstyle", function () {
		Addons.ClassicStyle.SetThemeAll("explorer");
	});

	Addons.ClassicStyle.SetThemeAll(null);
}
