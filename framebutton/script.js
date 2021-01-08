const Addon_Id = "framebutton";
const Default = "ToolBar2Left";
if (window.Addon == 1) {
	Addons.FrameButton = {
		Exec: async function (Ctrl, pt) {
			const FV = await GetFolderView(Ctrl, pt);
			FV.Focus();
			Exec(Ctrl, "Show frames", "Tabs", 0, pt);
		}
	}
	const item = await GetAddonElement(Addon_Id);
	const h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	const src = item.getAttribute("Icon") || (h <= 16 ? "bitmap:ieframe.dll,216,16,4" : "bitmap:ieframe.dll,214,24,4");
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.FrameButton.Exec(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({ title: "Show frames", src: src }, h), '</span>']);
} else {
	EnableInner();
}
