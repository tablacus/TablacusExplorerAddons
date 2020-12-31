const Addon_Id = "wlx";
const item = await $.GetAddonElement(Addon_Id);
if (!await item.getAttribute("Set")) {
	item.setAttribute("MenuExec", -1);
	item.setAttribute("Menu", "Context");
	item.setAttribute("MenuPos", -1);
	item.setAttribute("KeyExec", 1);
	item.setAttribute("KeyOn", "List");
	item.setAttribute("Key", "Ctrl+Q");
}
if (window.Addon == 1) {
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
