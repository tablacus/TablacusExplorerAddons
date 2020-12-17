const Addon_Id = "ffc";
const item = await $.GetAddonElement(Addon_Id);
if (!await item.getAttribute("Set")) {
	item.setAttribute("Class", "{E6385E40-E2A6-11d5-ABE6-9EB61339EA35}");
	item.setAttribute("Copy", 1);
	item.setAttribute("Move", 2);
}
if (window.Addon == 1) {
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
