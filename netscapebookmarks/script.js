const Addon_Id = "netscapebookmarks";
if (window.Addon == 1) {
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	SetTabContents(0, "", '<table style="width: 100%"><tr><td><input type="checkbox" id="NewTab"><label>New Tab</label></td></tr></table>');
}
