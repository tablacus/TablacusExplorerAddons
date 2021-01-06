const Addon_Id = "rotatepane";
const Default = "ToolBar2Left";
const item = await GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("Menu", "Tool");
	item.setAttribute("MenuPos", -1);
	item.setAttribute("KeyOn", "All");
	item.setAttribute("MouseOn", "List");
}
if (window.Addon == 1) {
	const h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	const src = item.getAttribute("Icon") || (h <= 16 ? "bitmap:ieframe.dll,216,16,33" : "bitmap:ieframe.dll,214,24,33");
	SetAddon(Addon_Id, Default, ['<span class="button" id="Run" onclick="SyncExec(Sync.RotatePane.Exec, this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({ title: item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name, src: src }, h), '</span>']);
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	EnableInner();
}
