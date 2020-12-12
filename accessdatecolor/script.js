const Addon_Id = "accessdatecolor";
if (window.Addon == 1) {
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	hint = "1s 1m 1h 1d 1w 1y";
	importScript("addons\\" + Addon_Id + "\\options.js");
}
