const Addon_Id = "systemfolders";
const Default = "ToolBar2Left";
const item = await GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuPos", -1);
}
if (window.Addon == 1) {
	const h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	const src = item.getAttribute("Icon") || (h <= 16 ? "icon:shell32.dll,42,16" : "icon:shell32.dll,42,32");
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="SyncExec(Sync.SystemFolders.Exec, this, 9)" oncontextmenu="SyncExec(Sync.SystemFolders.Popup, this); return false" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({ title: item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name, src: src }, h), '</span>']);
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	EnableInner();
	SetTabContents(0, "General", '<input type="checkbox" name="!NoNewTab"><label>Open in new tab</label>');
	document.getElementById("panel7").innerHTML += '<div><input type="checkbox" name="Flat"><label>Flat</label></div>';
}
