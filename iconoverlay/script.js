const Addon_Id = "iconoverlay";
if (window.Addon == 1) {
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	SetTabContents(0, "General", '<label>Base</label><br><input type="text" id="Base" placeholder="11" style="width: 100%">');
}
