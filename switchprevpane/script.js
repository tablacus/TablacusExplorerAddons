if (window.Addon == 1) {
	Addons.SwitchPrevPane = {
		Exec: function (Ctrl) {
			Sync.SwitchPrevPane.Exec(Ctrl);
			return S_OK;
		}
	}
	const Addon_Id = "switchprevpane";
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
}
