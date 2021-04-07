const Addon_Id = "preventduplicatetabs";
if (window.Addon == 1) {
	Addons.PreventDuplicateTabs = {
		KillTimer: function () {
			if (Addons.PreventDuplicateTabs.tid) {
				clearTimeout(Addons.PreventDuplicateTabs.tid);
				delete Addons.PreventDuplicateTabs.tid;
			}
		}
	};

	AddEvent("ListViewCreated", function (Ctrl) {
		Addons.PreventDuplicateTabs.KillTimer();
		Addons.PreventDuplicateTabs.tid = setTimeout(Sync.PreventDuplicateTabs.Exec, 999, Ctrl);
	}, true);

	$.importScript("addons\\" + Addon_Id + "\\sync.js");
	if (!HOME_PATH) {
		HOME_PATH = "about:blank";
	}
} else {
	SetTabContents(0, "General", '<label><input type="checkbox" name="Filter">Filter</label>');
}
