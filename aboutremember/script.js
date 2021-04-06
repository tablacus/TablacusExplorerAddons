var Addon_Id = "aboutremember";
if (window.Addon == 1) {
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	SetTabContents(0, "", '<label>Add</label><br><label><input type="checkbox" id="AddToMenu">Menus</label>');
}
