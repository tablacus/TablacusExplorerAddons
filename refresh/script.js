const Addon_Id = "refresh";
const Default = "ToolBar2Left";
if (window.Addon == 1) {
	AddEvent("Layout", async function () {
		const item = await GetAddonElement(Addon_Id);
		const h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
		const src = item.getAttribute("Icon") || (h <= 16 ? "bitmap:ieframe.dll,206,16,3" : "bitmap:ieframe.dll,204,24,3");
		SetAddon(Addon_Id, Default, ['<span class="button" onclick="Refresh()" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({ title: await GetText("Refresh"), src: src }, h), '</span>']);
	});
} else {
	EnableInner();
}
