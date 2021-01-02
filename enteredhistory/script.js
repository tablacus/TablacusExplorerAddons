const Addon_Id = "enteredhistory";
if (window.Addon == 1) {
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	SetTabContents(0, "", '<label>Number of items</label><br><input type="text" name="Save" size="4" placeholder="50">');
}
