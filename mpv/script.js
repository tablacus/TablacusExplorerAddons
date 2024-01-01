const Addon_Id = "mpv";
const Default = "ToolBar2Left";
const item = GetAddonElement(Addon_Id);

if (window.Addon == 1) {
	Addons.mpv = {
		State: function (bDisabled) {
			DisableImage(document.getElementById("Imgmpv_$"), bDisabled);
		}
	}
	AddEvent("Layout", async function () {
		SetAddon(Addon_Id, Default, ['<span class="button" onclick="SyncExec(Sync.mpv.Exec, this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({
			title: item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name,
			id: "Imgmpv_$",
			src: item.getAttribute("Icon") || await Sync.mpv.AppPath || "icon:shell32.dll,137"
		}, GetIconSizeEx(item)), '</span>']);
	});
	AddEvent("PanelCreated", async function (Ctrl, Id) {
		Addons.mpv.State(await Sync.mpv.Disabled);
	});

	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	SetTabContents(0, "General", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));
}
