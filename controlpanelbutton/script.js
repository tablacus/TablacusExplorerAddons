const Addon_Id = "controlpanelbutton";
const Default = "ToolBar2Left";
if (window.Addon == 1) {
	Addons.ControlPanelButton = {
		Open: async function (o) {
			const pt = GetPos(o, 9);
			(await GetFolderView(o)).Focus();
			const FolderItem = await FolderMenu.Open(WINVER >= 0x600 ? "::{26EE0668-A00A-44D7-9371-BEB064C98683}" : ssfCONTROLS, pt.x, pt.y, "*", 1);
			if (FolderItem) {
				FolderMenu.Invoke(FolderItem);
			}
		}
	}
	AddEvent("Layout", async function () {
		const item = await GetAddonElement(Addon_Id);
		SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.ControlPanelButton.Open(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({
			title: await api.LoadString(hShell32, 4161),
			src: item.getAttribute("Icon") || "icon:shell32.dll,21"
		}, GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16)), '</span>']);
	});
} else {
	EnableInner();
}
