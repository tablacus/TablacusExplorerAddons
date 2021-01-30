if (window.Addon == 1) {
	Addons.ClassicStyle = {
		SetTheme: async function(Ctrl, s) {
			const hwnd = await Ctrl.hwndList;
			if (hwnd) {
				api.SetWindowTheme(hwnd, s || null, null);
			}
		},

		SetThemeAll: async function (s) {
			const cFV = await te.Ctrls(CTRL_FV);
			for (let i = await cFV.Count; --i >= 0;) {
				Addons.ClassicStyle.SetTheme(await cFV[i], s);
			}
		}
	};
	Sync.ClassicStyle = true;

	AddEvent("ListViewCreated", Addons.ClassicStyle.SetTheme);

	AddEventId("AddonDisabledEx", "classicstyle", function () {
		Addons.ClassicStyle.SetThemeAll("explorer");
	});

	Addons.ClassicStyle.SetThemeAll(null);
}
