const Addon_Id = "rememberselection";
if (window.Addon == 1) {
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	SetTabContents(0, "", '<label>Number of items</label><br><input type="text" id="Save" class="full" placeholder="1000"><br><input type="button" value="Delete" onclick="Addons.RememberSelection.Delete()">');
	Addons.RememberSelection = {
		Delete: function () {
			DeleteItem(await OrganizePath(Addon_Id, BuildPath(ui_.DataFolder, "config")) + ".tsv", FOF_ALLOWUNDO);
		}
	}
}
