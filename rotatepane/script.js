const Addon_Id = "rotatepane";
const Default = "ToolBar2Left";
let item = await GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("Menu", "Tool");
	item.setAttribute("MenuPos", -1);
	item.setAttribute("KeyOn", "All");
	item.setAttribute("MouseOn", "List");
}
if (window.Addon == 1) {
	AddEvent("Layout", async function () {
		SetAddon(Addon_Id, Default, ['<span class="button" id="Run" onclick="SyncExec(Sync.RotatePane.Exec, this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({
			title: item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name,
			src: item.getAttribute("Icon") || (WINVER >= 0xa00 ? "font:Segoe MDL2 Assets,0xe7ad" : "bitmap:ieframe.dll,214,24,33")
		}, GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16)), '</span>']);
		delete item;
	});
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	EnableInner();
}
