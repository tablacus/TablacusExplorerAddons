const Addon_Id = "hotbutton";
if (window.Addon == 1) {
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	SetTabContents(0, "General", '<label><input type="checkbox" id="Select">Select</label><br><label><input type="checkbox" id="NoInfotip">No Infotip</label>');
	ChangeForm([["__IconSize", "style/display", "none"]]);
}
