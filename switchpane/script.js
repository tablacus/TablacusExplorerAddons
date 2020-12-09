if (window.Addon == 1) {
	Addons.SwitchPane = {
		NextFV: function (Ctrl) {
			Sync.SwitchPane.NextFV(Ctrl);
			return S_OK;
		}
	}
	const Addon_Id = "switchpane";
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
}
