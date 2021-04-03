const Addon_Id = "duplicatecopy";
const Default = "None";
if (window.Addon == 1) {
	AddEvent("Layout", async function () {
		const item = await GetAddonElement(Addon_Id);
		SetAddon(Addon_Id, Default, ['<span class="button" onclick="SyncExec(Sync.DuplicateCopy.Exec, this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({
			title: item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name,
			src: item.getAttribute("Icon") || "icon:general,6"
		}, GetIconSizeEx(item)), '</span>']);
	});

	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	EnableInner();
}
