const Addon_Id = "virtualrecyclebin";
const item = await $.GetAddonElement(Addon_Id);
if (!await item.getAttribute("Set")) {
	item.setAttribute("Network", 1);
	item.setAttribute("Removable", 1);
	item.setAttribute("Path", "recyclebin");

	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "Background");
	item.setAttribute("MenuPos", -1);
}
if (window.Addon == 1) {
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	SetTabContents(0, "General", '<input type="checkbox" id="Network"><label for="Network">@shell32.dll,-9319[-9428]</label><br><input type="checkbox" id="Removable"><label for="Removable">@shell32.dll,-9309[-9396]</label><br><label>Path</label><br><input type="text" id="Path" style="width: 100%">');
}
