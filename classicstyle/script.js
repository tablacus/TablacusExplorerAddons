if (window.Addon == 1) {
	Addons.ClassicStyle =
	{
		SetThemeAll: function (s) {
			var cFV = te.Ctrls(CTRL_FV);
			for (var i in cFV) {
				var FV = cFV[i];
				if (FV.hwndList) {
					api.SetWindowTheme(FV.hwndList, s, null);
				}
			}
		}
	};
	AddEventId("AddonDisabledEx", "classicstyle", function () {
		Addons.ClassicStyle.SetThemeAll("explorer");
	});
	Addons.ClassicStyle.SetThemeAll(null);
}
