var Addon_Id = "newtab";
var Default = "ToolBar2Left";

if (window.Addon == 1) {
	var s = (IconSize == 16) ? 'src="../image/toolbar/s_1_12.png" bitmap="ieframe.dll,216,16,12"' : 'src="../image/toolbar/m_1_12.png" bitmap="ieframe.dll,214,24,12"';
	s = '<span class="button" onclick="CreateTab()" onmouseover="MouseOver(this)" onmouseout="MouseOut()"><img alt="New Tab" ' + s + '></span> ';
	SetAddon(Addon_Id, Default, s);
}
