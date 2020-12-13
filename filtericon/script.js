const Addon_Id = "filtericon";
if (window.Addon == 1) {
	if (WINVER >= 0x600 && await api.IsAppThemed()) {
		AddEvent("Load", function () {
			if (!Addons.ClassicStyle) {
				Sync.FilterIcon.SetStyle();
			}
		});
	}
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	arIndex = ["Filter", "Small", "Large"];
	importScript("addons\\" + Addon_Id + "\\options.js");
}
