const Addon_Id = "synchronize";
const Default = "ToolBar2Left";
const item = await GetAddonElement(Addon_Id);
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
				const cTC = await te.Ctrls(CTRL_TC);
				for (let i = await cTC.Count; i-- > 0;) {
					el = document.getElementById("ImgSynchronize_" + await cTC[i].Id);
					if (el) {
						DisableImage(el, bDisabled);
					}
				}
			}
		}
	}

	AddEvent("PanelCreated", async function (Ctrl, Id) {
		Addons.Synchronize.State(await Sync.Synchronize.Disabled);
	});

	const h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	const src = item.getAttribute("Icon") || "../addons/synchronize/synchronize.png";
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="SyncExec(Sync.Synchronize.Exec, this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({ title: item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name, id: "ImgSynchronize_$", src: src }, h), '</span>']);
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	EnableInner();
	SetTabContents(0, "General", '<Label><input type="checkbox" name="Start">Enabled</label>');
}
