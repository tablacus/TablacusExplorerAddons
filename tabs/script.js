const Addon_Id = "tabs";
if (window.Addon == 1) {
	Addons.Tabs = {
		setTimeout: function (fn, tm) {
			Addons.Tabs.clearTimeout();
			Addons.Tabs.tid = setTimeout(fn, tm);
		},

		clearTimeout: function () {
			if (Addons.Tabs.tid) {
				clearTimeout(Addons.Tabs.tid);
				delete Addons.Tabs.tid;
			}
		}
	};

	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
