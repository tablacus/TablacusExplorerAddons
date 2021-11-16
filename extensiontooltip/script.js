const Addon_Id = "extensiontooltip";
if (window.Addon == 1) {
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	arIndex = ["Type", "Data"];
	importScript("addons\\" + Addon_Id + "\\options.js");
}
