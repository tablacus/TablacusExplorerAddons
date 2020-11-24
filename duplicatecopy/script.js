var Addon_Id = "duplicatecopy";
var Default = "None";

if (window.Addon == 1) {
	var item = await GetAddonElement(Addon_Id);
	Addons.DuplicateCopy = {
		Exec: async function (el) {
			Sync.DuplicateCopy.Exec(await GetFolderViewEx(el));
			return S_OK;
		}
	}
	var h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	var src = item.getAttribute("Icon") || (h <= 16 ? "bitmap:ieframe.dll,216,16,6" : "bitmap:ieframe.dll,214,24,6");
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.DuplicateCopy.Exec(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({ title: item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name, src: src }, h), '</span>']);
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	EnableInner();
}
