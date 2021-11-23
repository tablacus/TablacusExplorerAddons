const Addon_Id = "darkmode";

if (window.Addon == 1) {
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	SetTabContents(0, "General", '<label><input type="checkbox" id="Auto">Auto</label><br>');
}
