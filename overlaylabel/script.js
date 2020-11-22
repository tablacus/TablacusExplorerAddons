var Addon_Id = "overlaylabel";
var item = await GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("Color", "#ff0000");
}
if (window.Addon == 1) {
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
