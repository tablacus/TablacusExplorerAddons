const Addon_Id = "labelbutton";
const Default = "ToolBar2Left";
if (window.Addon == 1) {
	AddEvent("Layout", async function () {
		const item = await GetAddonElement(Addon_Id);
		SetAddon(Addon_Id, Default, ['<span class="button" onclick="SyncExec(Sync.LabelButton.Exec, this, 9)" oncontextmenu="SyncExec(Sync.LabelButton.Popup, this, 9); return false" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({
			title: await api.PSGetDisplayName("System.Contact.Label"),
			src: item.getAttribute("Icon") || GetWinIcon(0x600, "icon:shell32.dll,289", 0, "font:Webdings,0x92")
		}, GetIconSizeEx(item)), '</span>']);
	});
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
}
