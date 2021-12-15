if (window.Addon == 1) {
	AddEvent("Layout", async function () {
		const Addon_Id = "newtab";
		const Default = "ToolBar2Left";
		const item = await GetAddonElement(Addon_Id);
		const h = GetIconSizeEx(item);
		SetAddon(Addon_Id, Default, ['<span class="button" onclick="CreateTab(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({
			title: await GetText("New Tab"),
			src: item.getAttribute("Icon") || "icon:general,12"
		}, h), '</span>']);
	});
} else {
	EnableInner();
}
