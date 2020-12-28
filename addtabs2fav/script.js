const Addon_Id = "addtabs2fav";
const Default = "None";
const item = await GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "Favorites");
	item.setAttribute("MenuPos", 0);
	item.setAttribute("MenuName", "Add all tabs to favorites...");
}
if (window.Addon == 1) {
	Addons.AddTabs2Fav = {
		Exec: async function (Ctrl, pt) {
			const FV = await GetFolderView(Ctrl, pt);
			FV.Focus();
			Sync.AddTabs2Fav.Exec(FV);
		}
	};
	const h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	const s = item.getAttribute("Icon") || h > 16 ? "bitmap:ieframe.dll,214,24,3" : "bitmap:ieframe.dll,216,16,3";
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.AddTabs2Fav.Exec(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({ title: item.getAttribute("MenuName") || GetText("Add all tabs to favories..."), src: s }, h), '</span>']);
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	EnableInner();
}
