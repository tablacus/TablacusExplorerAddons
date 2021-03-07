const Addon_Id = "wlx";
const Default = "None";
const item = await GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", -1);
	item.setAttribute("Menu", "Context");
	item.setAttribute("MenuPos", -1);
	item.setAttribute("KeyExec", 1);
	item.setAttribute("KeyOn", "List");
	item.setAttribute("Key", "Ctrl+Q");
}
if (window.Addon == 1) {
	const h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	const s = item.getAttribute("Icon") || WINVER > 0x603 ? "font:Segoe MDL2 Assets,0xea,55" : "font:Consolas,0x4e,9";
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="SyncExec(Sync.WLX.Exec, this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({ title: item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name, src: s }, h), '</span>']);
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
