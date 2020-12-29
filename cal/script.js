const Addon_Id = "cal";
if (window.Addon == 1) {
	Addons.CAL = {
		Refresh: function (Ctrl) {
			if (Addons.CAL.tidRefresh) {
				clearTimeout(Addons.CAL.tidRefresh)
			}
			Addons.CAL.tidRefresh = setTimeout(function (Ctrl) {
				delete Addons.CAL.tidRefresh;
				Ctrl.Refresh();
			}, 99, Ctrl);
		},
	};
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
