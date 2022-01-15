const Addon_Id = "notepadalternative";
if (window.Addon == 1) {
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	SetTabContents(0, "", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));
}
