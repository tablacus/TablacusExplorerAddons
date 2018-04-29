var Addon_Id = "controlpanelbutton";
var Default = "ToolBar2Left";

if (window.Addon == 1) {
	Addons.ControlPanelButton = 
	{
		Open: function(o)
		{
			var pt = GetPos(o);
			var FolderItem = FolderMenu.Open(WINVER >= 0x600 ? "::{26EE0668-A00A-44D7-9371-BEB064C98683}" : ssfCONTROLS, screenLeft + pt.x, screenTop + pt.y + o.offsetHeight * screen.deviceYDPI / screen.logicalYDPI, "*", 1);
			if (FolderItem) {
				FolderMenu.Invoke(FolderItem);
			}
		}
	}

	var h = GetAddonOption(Addon_Id, "IconSize") || window.IconSize || 24;
	var src =  ExtractMacro(te, GetAddonOption(Addon_Id, "Icon")) || (h <= 16 ? "icon:shell32.dll,21,16" : "icon:shell32.dll,21,32");
	var s = ['<span class="button" onmousedown="Addons.ControlPanelButton.Open(this); return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()"><img title="', api.LoadString(hShell32, 4161),'" src="', EncodeSC(src), '" style="width:', h, 'px; height:', h, 'px"></span>'];
	SetAddon(Addon_Id, Default, s);
}
