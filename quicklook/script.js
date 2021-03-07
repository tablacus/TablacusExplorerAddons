const Addon_Id = "quicklook";
const Default = "None";
const item = await GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "Edit");
	item.setAttribute("MenuPos", -1);

	item.setAttribute("KeyExec", 1);
	item.setAttribute("KeyOn", "List");
	item.setAttribute("Key", "$39");

	item.setAttribute("MouseOn", "List");
}

if (window.Addon == 1) {
	const h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	const s = item.getAttribute("Icon") || (h > 16 ? "bitmap:ieframe.dll,214,24,14" : "bitmap:ieframe.dll,216,16,14");
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="SyncExec(Sync.QuickLook.Exec, this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({ title: item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name, src: s }, h), '</span>']);
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	EnableInner();
	SetTabContents(0, "General", '<input type="button" value="' + await api.sprintf(99, await GetText("Get %s..."), "QuickLook") + '" title="https://github.com/QL-Win/QuickLook/releases" onclick="wsh.Run(this.title)">');
}
