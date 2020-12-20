const Addon_Id = "menuimage";
const item = await $.GetAddonElement(Addon_Id);
if (!await item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "Context");
	item.setAttribute("MenuPos", -1);
}
if (window.Addon == 1) {
	await $.importScript("addons\\" + Addon_Id + "\\sync.js");
}
