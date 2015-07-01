var Addon_Id = "refresh";
var Default = "ToolBar2Left";

if (window.Addon == 1) {
	var h = GetAddonOption(Addon_Id, "IconSize") || window.IconSize || 24;
	var s = GetAddonOption(Addon_Id, "Icon") || (h <= 16 ? "bitmap:ieframe.dll,206,16,3" : "bitmap:ieframe.dll,204,24,3");
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Refresh(this); return false;" oncontextmenu="return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()"><img title="Refresh" src="', s.replace(/"/g, ""), '" width="', h, 'px" height="', h, 'px"></span>']);
}
else {
	EnableInner();
}
