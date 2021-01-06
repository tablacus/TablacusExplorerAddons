const Addon_Id = "teracopy";
const item = await $.GetAddonElement(Addon_Id);
if (!await item.getAttribute("Set")) {
	item.setAttribute("Copy", 1);
	item.setAttribute("Move", 2);
}
if (window.Addon == 1) {
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
