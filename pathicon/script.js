const Addon_Id = "pathicon";
if (window.Addon == 1) {
	if (WINVER >= 0x600 && await api.IsAppThemed()) {
		AddEvent("Load", function () {
			if (!Addons.ClassicStyle) {
				Sync.PathIcon.SetStyle();
			}
		});
	}
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	arIndex = ["Path", "Small", "Large"];
	importScript("addons\\" + Addon_Id + "\\options.js");
}
