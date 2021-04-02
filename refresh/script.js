const Addon_Id = "refresh";
const Default = "ToolBar2Left";
if (window.Addon == 1) {
	AddEvent("Layout", async function () {
		const item = await GetAddonElement(Addon_Id);
		SetAddon(Addon_Id, Default, ['<span class="button" onclick="SyncExec(Refresh, this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({
			title: await GetText("Refresh"),
			src: item.getAttribute("Icon") || "icon:browser,3"
		}, GetIconSizeEx(item)), '</span>']);
	});
} else {
	EnableInner();
}
