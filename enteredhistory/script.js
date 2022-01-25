if (window.Addon == 1) {
	const Addon_Id = "enteredhistory";
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	SetTabContents(0, "", '<label>Number of items</label><br><input type="text" name="Save" class="number" placeholder="50">');
}
