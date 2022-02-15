const Addon_Id = "sethome";
let item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	if (window.chrome) {
		item = await $.GetAddonElement(Addon_Id);
	}
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "Tabs");
	item.setAttribute("MenuPos", -1);

	item.setAttribute("KeyOn", "List");
	item.setAttribute("Key", "");

	item.setAttribute("MouseOn", "List");
	item.setAttribute("Mouse", "");
}
if (window.Addon == 1) {
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
}
