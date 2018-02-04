var Addon_Id = "newtab";
var Default = "ToolBar2Left";

if (window.Addon == 1) {
	var h = GetAddonOption(Addon_Id, "IconSize") || window.IconSize;
	var src = GetAddonOption(Addon_Id, "Icon") || (h <= 16 ? "bitmap:ieframe.dll,216,16,12" : "bitmap:ieframe.dll,214,24,12");
	var s = ['<span class="button" onclick="CreateTab(); return false;" oncontextmenu="return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()"><img title="New Tab" src="', src.replace(/"/g, ""), '" width="', h, 'px" height="' + h, 'px"></span>'];
	SetAddon(Addon_Id, Default, s);
}
