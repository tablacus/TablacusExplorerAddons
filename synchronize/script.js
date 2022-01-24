const Addon_Id = "synchronize";
const Default = "ToolBar2Left";
let item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("Menu", "Edit");
	item.setAttribute("MenuPos", -1);
	item.setAttribute("KeyOn", "All");
	item.setAttribute("MouseOn", "List");
}
if (window.Addon == 1) {
	Addons.Synchronize = {
		State: async function (bDisabled) {
			let el = document.getElementById("ImgSynchronize_$");
			if (el) {
				DisableImage(el, bDisabled);
			} else {
				const cTC = await te.Ctrls(CTRL_TC, false, window.chrome);
				for (let i = cTC.length; i-- > 0;) {
					el = document.getElementById("ImgSynchronize_" + await cTC[i].Id);
					if (el) {
						DisableImage(el, bDisabled);
					}
				}
			}
		}
	}

	AddEvent("Layout", async function () {
		SetAddon(Addon_Id, Default, ['<span class="button" onclick="SyncExec(Sync.Synchronize.Exec, this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({
			title: item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name,
			id: "ImgSynchronize_$",
			src: item.getAttribute("Icon") || await GetMiscIcon(Addon_Id) || (WINVER >= 0xa00 ? "font:Segoe MDL2 Assets,0xe895" : "font:Webdings,0x71")
		}, GetIconSizeEx(item)), '</span>']);
		delete item;
	});

	AddEvent("PanelCreated", async function (Ctrl, Id) {
		Addons.Synchronize.State(await Sync.Synchronize.Disabled);
	});

	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	EnableInner();
	SetTabContents(0, "General", '<Label><input type="checkbox" name="Start">Enabled</label>');
}
