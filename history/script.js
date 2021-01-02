const Addon_Id = "history";
const Default = "ToolBar2Left";
const item = await GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("Menu", "File");
	item.setAttribute("MenuPos", -1);

	item.setAttribute("KeyExec", 1);
	item.setAttribute("KeyOn", "All");
	item.setAttribute("Key", "Ctrl+H");

	item.setAttribute("Save", 1000);
}
if (window.Addon == 1) {
	Addons.History1 = {
		Exec: async function (Ctrl, pt) {
			Sync.History1.Exec(await GetFolderView(Ctrl, pt), pt);
		}
	};

	const h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	const s = item.getAttribute("Icon") || (h <= 16 ? "bitmap:ieframe.dll,206,16,12" : "bitmap:ieframe.dll,204,24,12");
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.History1.Exec(this);" oncontextmenu="return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({ title: item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name, src: s }, h), '</span>']);
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	EnableInner();
	SetTabContents(0, "General", '<label>Number of items</label><br><input type="text" name="Save" size="4">');
}
