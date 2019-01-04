var Addon_Id = "newtab";
var Default = "ToolBar2Left";

if (window.Addon == 1) {
	var item = GetAddonElement(Addon_Id);
	var h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	var src = item.getAttribute("Icon") || (h <= 16 ? "bitmap:ieframe.dll,216,16,12" : "bitmap:ieframe.dll,214,24,12");
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="CreateTab(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', GetImgTag({ title: "New Tab", src: src }, h), '</span>']);
} else {
	EnableInner();
}