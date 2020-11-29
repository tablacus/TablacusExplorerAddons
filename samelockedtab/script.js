const Addon_Id = "samelockedtab";
if (window.Addon == 1) {
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	SetTabContents(0, "", '<input type="checkbox" id="Close"><label for="Close">Close</label><br><input type="checkbox" id="Multi"><label for="Multi">Multiple panes</label>');
}
