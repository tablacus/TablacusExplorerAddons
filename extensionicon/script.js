const Addon_Id = "extensionicon";
if (window.Addon == 1) {
	if (WINVER >= 0x600 && await api.IsAppThemed()) {
		AddEvent("Load", function () {
			if (!Addons.ClassicStyle) {
				Sync.ExtensionIcon.SetStyle();
			}
		});
	}
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	arIndex = ["Type", "Small", "Large"];
	importScript("addons\\" + Addon_Id + "\\options.js");
}
