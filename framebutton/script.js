var Addon_Id = "framebutton";
var Default = "ToolBar2Left";

if (window.Addon == 1) {
	Addons.FrameButton = {
		Exec: function (Ctrl, pt) {
			var FV = GetFolderView(Ctrl, pt);
			FV.Focus();
			Exec(Ctrl, "Show frames", "Tabs", 0, pt);
			return S_OK;
		}
	}
	var item = GetAddonElement(Addon_Id);
	var h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	var src = item.getAttribute("Icon") || (h <= 16 ? "bitmap:ieframe.dll,216,16,4" : "bitmap:ieframe.dll,214,24,4");
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.FrameButton.Exec(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', GetImgTag({ title: "Show frames", src: src }, h), '</span>']);
} else {
	EnableInner();
}
