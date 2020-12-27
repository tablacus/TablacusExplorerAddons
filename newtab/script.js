if (window.Addon == 1) {
	const Addon_Id = "newtab";
	const Default = "ToolBar2Left";
	const item = await GetAddonElement(Addon_Id);
	const h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	const src = item.getAttribute("Icon") || (h <= 16 ? "bitmap:ieframe.dll,216,16,12" : "bitmap:ieframe.dll,214,24,12");
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="CreateTab(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({ title: "New Tab", src: src }, h), '</span>']);
} else {
	EnableInner();
}
