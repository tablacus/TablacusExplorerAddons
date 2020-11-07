var Addon_Id = "retouch";
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

	Addons.Retouch = {
		Exec: async function (o) {
			Sync.Retouch.Exec(await GetFolderViewEx(o));
		}
	}
	var h = GetIconSize(await item.getAttribute("IconSize"), await item.getAttribute("Location") == "Inner" && 16);
	var s = await item.getAttribute("Icon") || (h <= 16 ? "icon:shell32.dll,141,16" : "icon:shell32.dll,141,32");
	s = ['<span class="button" id="RetouchButton" onclick="Addons.Retouch.Exec(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({ title: await Sync.Retouch.strName, src: s }, h), '</span>'];
	SetAddon(Addon_Id, Default, s);
} else {
	EnableInner();
}
