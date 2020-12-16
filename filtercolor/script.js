const Addon_Id = "filtercolor";
if (window.Addon == 1) {
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	SetTabContents(0, "General", '<label><input type="checkbox" name="Path">Path</label>');
	hint = await GetText("Filter");
	importScript("addons\\" + Addon_Id + "\\options.js");
}
