const Addon_Id = "nonexistentoverlay";
if (window.Addon == 1) {
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	ChangeForm([["__IconSize", "style/display", "none"]]);
}
