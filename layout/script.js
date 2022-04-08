const Addon_Id = "layout";
const Default = "ToolBar2Left";
let item = GetAddonElement(Addon_Id);

if (window.Addon == 1) {
	AddEvent("Layout", async function () {
		await SetAddon(Addon_Id, Default, [await GetImgTag({
			title: item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name,
			src: item.getAttribute("Icon") || "bitmap:ieframe.dll,697,24,1",
			onclick: "SyncExec(Sync.Layout.Exec, this, 9)",
			"class": "button"
		}, GetIconSizeEx(item))]);
	});

	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	SetTabContents(0, "General", (await ReadTextFile("addons\\" + Addon_Id + "\\options.html")).replace("%s", BuildPath(ui_.DataFolder, "layout")));
	EnableInner();
}
