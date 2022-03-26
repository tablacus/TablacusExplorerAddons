const Addon_Id = "quicknotes";
const Default = "ToolBar2Left";
let item = GetAddonElement(Addon_Id);

Addons.QuickNotes = {
	ShowOptions: function () {
		AddonOptions("quicknotes", function () {
		});
	},
}

if (window.Addon == 1) {
	AddEvent("Layout", async function () {
		await SetAddon(Addon_Id, Default, [await GetImgTag({
			title: item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name,
			src: item.getAttribute("Icon") || "icon:shell32.dll,1",
			onclick: "SyncExec(Sync.QuickNotes.Exec, this, 9)",
			oncontextmenu: "SyncExec(Sync.QuickNotes.Popup); return false",
			"class": "button"
		}, GetIconSizeEx(item))]);
	});

	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
