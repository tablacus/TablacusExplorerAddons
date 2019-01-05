var Addon_Id = "controlpanelbutton";
var Default = "ToolBar2Left";

if (window.Addon == 1) {
	var item = GetAddonElement(Addon_Id);

	Addons.ControlPanelButton =
	{
		Open: function(o)
		{
			var pt = GetPos(o);
			var FolderItem = FolderMenu.Open(WINVER >= 0x600 ? "::{26EE0668-A00A-44D7-9371-BEB064C98683}" : ssfCONTROLS, screenLeft + pt.x, screenTop + pt.y + o.offsetHeight, "*", 1);
			if (FolderItem) {
				FolderMenu.Invoke(FolderItem);
			}
		}
	}

	var h = item.getAttribute("IconSize") || window.IconSize || 24;
	var src = item.getAttribute("Icon") || (h <= 16 ? "icon:shell32.dll,21,16" : "icon:shell32.dll,21,32");
	SetAddon(Addon_Id, Default, ['<span class="button" onmousedown="Addons.ControlPanelButton.Open(this); return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', GetImgTag({ title: api.LoadString(hShell32, 4161), src: src }, h), '</span>']);
} else {
	EnableInner();
}
