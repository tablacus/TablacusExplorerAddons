const Addon_Id = "tabcolorplus";
if (window.Addon == 1) {
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	hint = await GetText("Filter");
	importScript("addons\\" + Addon_Id + "\\options.js");
}
