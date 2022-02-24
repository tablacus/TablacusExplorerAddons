const Addon_Id = "saveselection";
const Default = "ToolBar2Left";
let item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "Edit");
	item.setAttribute("MenuPos", -1);

	item.setAttribute("KeyOn", "List");

	item.setAttribute("MouseOn", "List");
}
if (window.Addon == 1) {
	AddEvent("Layout", async function () {
		await SetAddon(Addon_Id, Default, [await GetImgTag({
			title: item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name,
			src: item.getAttribute("Icon") || "icon:general,13",
			onclick: "SyncExec(Sync.SaveSelection.Exec, this, 9)",
			ondragstart: "SyncExec(Sync.SaveSelection.Drag, this); return false",
			"class": "button"
		}, GetIconSizeEx(item))]);
	});

	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
