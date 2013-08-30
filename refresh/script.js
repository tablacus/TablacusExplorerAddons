var Addon_Id = "refresh";
var Default = "ToolBar2Left";

if (!window.dialogArguments) {
	var s = (window.IconSize == 16) ? 'src="../image/toolbar/s_2_3.png" bitmap="ieframe.dll,206,16,3"' : 'src="../image/toolbar/m_2_3.png" bitmap="ieframe.dll,204,24,3"';
	s = '<span class="button" onclick="Refresh()" oncontextmenu="return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()"><img alt="Refresh" ' + s + '></span><span style="width: 1px"> </span>';
	SetAddon(Addon_Id, Default, s);
}
