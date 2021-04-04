const Addon_Id = "switchhidden";
const Default = "None";
let item = await GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "View");
	item.setAttribute("MenuPos", -1);
}
if (window.Addon == 1) {
	Addons.SwitchHidden = {
		sName: item.getAttribute("MenuName") || await api.LoadString(hShell32, 12856),

		Exec: async function (Ctrl, pt) {
			const FV = await GetFolderView(Ctrl, pt);
			if (FV) {
				FV.Focus();
				FV.ViewFlags = await FV.ViewFlags ^ CDB2GVF_SHOWALLFILES;
				FV.Refresh();
			}
		}
	};
	//Menu
	if (item.getAttribute("MenuExec")) {
		SetMenuExec("SwitchHidden", Addons.SwitchHidden.sName, item.getAttribute("Menu"), item.getAttribute("MenuPos"));
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.SwitchHidden.Exec, "Async");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.SwitchHidden.Exec, "Async");
	}

	AddEvent("Layout", async function () {
		SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.SwitchHidden.Exec(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({
			title: Addons.SwitchHidden.sName,
			src: item.getAttribute("Icon") || await GetMiscIcon("togglehidden") || "bitmap:ieframe.dll,697,24,43"
		}, GetIconSizeEx(item)), '</span>']);
		delete item;
	});

	AddTypeEx("Add-ons", "Switch hidden items", Addons.SwitchHidden.Exec);
} else {
	EnableInner();
}
