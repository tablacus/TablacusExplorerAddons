const Addon_Id = "fixedtabname";
const item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "Tabs");
	item.setAttribute("MenuPos", 0);

	item.setAttribute("KeyOn", "List");
	item.setAttribute("Key", "");

	item.setAttribute("MouseOn", "List");
	item.setAttribute("Mouse", "");
}
if (window.Addon == 1) {
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
}
