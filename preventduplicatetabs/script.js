if (window.Addon == 1) {
	const Addon_Id = "preventduplicatetabs";
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
	if (!HOME_PATH) {
		HOME_PATH = ssfRECENT;
	}
}
