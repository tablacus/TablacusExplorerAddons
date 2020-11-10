var Addon_Id = "findfiles";
var Default = "None";

var item = await GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("Menu", "File");
	item.setAttribute("MenuPos", -1);

	item.setAttribute("KeyExec", 1);
	item.setAttribute("KeyOn", "All");
	item.setAttribute("Key", "$3d");
}

if (window.Addon == 1) {
	Addons.FindFiles = {
		Exec: async function (Ctrl) {
			Sync.FindFiles.Exec(await GetFolderViewEx(Ctrl));
		}
	}

	await importJScript("addons\\" + Addon_Id + "\\sync.js");
	var h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	var src = item.getAttribute("Icon") || (h <= 16 ? "bitmap:ieframe.dll,216,16,17" : "bitmap:ieframe.dll,214,24,17");
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.FindFiles.Exec(this);" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({ title: await Sync.FindFiles.strName, src: src }, h), '</span>']);
} else {
	EnableInner();
}
