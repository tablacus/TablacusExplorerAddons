const Addon_Id = "protecttabs";
const item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "Tabs");
	item.setAttribute("MenuPos", -1);
}
if (window.Addon == 1) {
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
}
