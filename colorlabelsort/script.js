const Addon_Id = "colorlabelsort";
const Default = "ToolBar2Left";
if (window.Addon == 1) {
	AddEvent("Layout", async function () {
		const item = await GetAddonElement(Addon_Id);
		SetAddon(Addon_Id, Default, ['<span class="button" onclick="SyncExec(Sync.ColorLabelSort.Exec, this, 9);" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({
			title: item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name,
			src: item.getAttribute("Icon") || "icon:general,27",
		}, GetIconSizeEx(item)), '</span>'].join(""));
	});

	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	EnableInner();
}
