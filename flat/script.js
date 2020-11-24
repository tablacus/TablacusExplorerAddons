var Addon_Id = "flat";
var Default = "None";

var item = await GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", -1);
	item.setAttribute("Menu", "Tabs");
	item.setAttribute("MenuPos", -1);
}
if (window.Addon == 1) {
	Addons.Flat = {
		Exec: async function (el) {
			Sync.Flat.Exec(await GetFolderViewEx(el));
			return S_OK;
		}
	}
	var h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	var src = item.getAttribute("Icon") || (h > 16 ? "bitmap:ieframe.dll,204,24,15" : "bitmap:ieframe.dll,206,16,15");
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.Flat.Exec(this);" oncontextmenu="Addons.Flat.Exec(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({ title: item.getAttribute("MenuName") || await GetText("Flat"), src: src }, h), '</span>']);
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	EnableInner();
}
