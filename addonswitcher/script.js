const Addon_Id = "addonswitcher";
if (window.Addon == 1) {
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
}
