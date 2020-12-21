const Addon_Id = "clipboardhistory";
const item = await $.GetAddonElement(Addon_Id);
if (!await item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "Background");
	item.setAttribute("MenuPos", 0);

	item.setAttribute("KeyOn", "List");
	item.setAttribute("MouseOn", "List");
}
if (window.Addon == 1) {
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	SetTabContents(0, "General", '<table style="width: 100%"><tr><td><label>Number of items</label></td></tr><tr><td><input type="text" name="Save" placeholder="15" size="4"></td><td><input type="button" value="Default" onclick="document.F.Save.value=\'\'"></td></tr></table>');
}
