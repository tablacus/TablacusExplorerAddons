const Addon_Id = "bgpreview";
const Default = "ToolBar2Left";
const item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "Edit");
	item.setAttribute("MenuPos", -1);

	item.setAttribute("KeyOn", "List");

	item.setAttribute("MouseOn", "List");
}

if (window.Addon == 1) {
	AddEvent("Layout", async function () {
		SetAddon(Addon_Id, Default, ['<span class="button" id="BGPreviewButton" onclick="SyncExec(Sync.BGPreview.Exec, this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({
			title: item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name,
			src: item.getAttribute("Icon") || "icon:general,14"
		}, GetIconSizeEx(item)), '</span>']);
	});

	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	EnableInner();
	await SetTabContents(0, "General", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));
	if (!item.getAttribute("Alpha")) {
		document.F.Alpha.value = 100;
	}
}
