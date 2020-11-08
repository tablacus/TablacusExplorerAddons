var Addon_Id = "infosearch";
var Default = "None";

var item = await GetAddonElement(Addon_Id);
if (!await item.getAttribute("Set")) {
	item.setAttribute("Menu", "File");
	item.setAttribute("MenuPos", -1);

	item.setAttribute("KeyExec", 1);
	item.setAttribute("KeyOn", "All");
	item.setAttribute("Key", "$103d");
}

if (window.Addon == 1) {
	Addons.InfoSearch = {
		Exec: async function (Ctrl) {
			Sync.InfoSearch.Exec(await GetFolderViewEx(Ctrl));
		}
	};
	await importJScript("addons\\" + Addon_Id + "\\sync.js");

	var h = await GetIconSize(await item.getAttribute("IconSize"), await item.getAttribute("Location") == "Inner" && 16);
	var src = await item.getAttribute("Icon") || (h <= 16 ? "bitmap:ieframe.dll,216,16,17" : "bitmap:ieframe.dll,214,24,17");
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.InfoSearch.Exec(this);" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({ title: await Sync.InfoSearch.strName, src: src }, h), '</span>']);

} else {
	EnableInner();
}
