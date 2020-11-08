var Addon_Id = "controlpanelbutton";
var Default = "ToolBar2Left";
if (window.Addon == 1) {
	var item = await GetAddonElement(Addon_Id);

	Addons.ControlPanelButton = {
		Open: async function (o) {
			var pt = GetPos(o, 9);
			(await GetFolderViewEx(o)).Focus();
			var FolderItem = await $.FolderMenu.Open(WINVER >= 0x600 ? "::{26EE0668-A00A-44D7-9371-BEB064C98683}" : ssfCONTROLS, pt.x, pt.y, "*", 1);
			if (FolderItem) {
				$.FolderMenu.Invoke(FolderItem);
			}
		}
	}
	var h = await GetIconSize(await item.getAttribute("IconSize"), await item.getAttribute("Location") == "Inner" && 16);
	var src = await item.getAttribute("Icon") || (h <= 16 ? "icon:shell32.dll,21,16" : "icon:shell32.dll,21,32");
	SetAddon(Addon_Id, Default, ['<span class="button" onmousedown="Addons.ControlPanelButton.Open(this); return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({ title: await api.LoadString(hShell32, 4161), src: src }, h), '</span>']);
} else {
	EnableInner();
}
