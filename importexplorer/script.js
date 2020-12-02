const Addon_Id = "importexplorer";
const Default = "ToolBar2Left";

let item = await GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("RealFolders", 1);
	item.setAttribute("SpecialFolders", 1);
	item.setAttribute("TakeOver", 1);
}

if (window.Addon == 1) {
	const h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	const src = await ExtractMacro(te, item.getAttribute("Icon") || "%windir%\\explorer.exe");
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="SyncExec(Sync.ImportExplorer.Exec, this);" oncontextmenu="SyncExec(Sync.ImportExplorer.Exec, this); return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({ title: item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name, src: src }, h), '</span>']);
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
	delete item;
} else {
	EnableInner();
	SetTabContents(0, "General", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));
}
