var Addon_Id = "previewwindow";
var Default = "ToolBar2Left";

var item = await GetAddonElement(Addon_Id);
if (!await item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "Edit");
	item.setAttribute("MenuPos", -1);

	item.setAttribute("KeyOn", "List");

	item.setAttribute("MouseOn", "List");
}

if (window.Addon == 1) {
	await importJScript("addons\\" + Addon_Id + "\\sync.js");

	Addons.PreviewWindow = {
		Exec: async function (o) {
			Sync.PreviewWindow.Exec(await GetFolderViewEx(o));
		}
	}
	var h = GetIconSize(await item.getAttribute("IconSize"), await item.getAttribute("Location") == "Inner" && 16);
	var s = await item.getAttribute("Icon") || (h > 16 ? "bitmap:ieframe.dll,214,24,14" : "bitmap:ieframe.dll,216,16,14");
	s = ['<span class="button" id="WindowPreviewButton" onclick="Addons.PreviewWindow.Exec(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({ title: await Sync.PreviewWindow.strName, src: s }, h), '</span>'];
	SetAddon(Addon_Id, Default, s);
} else {
	EnableInner();
	SetTabContents(0, "General", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));
}
