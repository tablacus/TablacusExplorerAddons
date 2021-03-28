const Addon_Id = "switchhiddenfilter";
const Default = "None";
let item = await GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "View");
	item.setAttribute("MenuPos", -1);
}
if (window.Addon == 1) {
	Addons.SwitchHiddenFilter = {
		sName: item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name,

		Exec: async function (Ctrl, pt) {
			te.UseHiddenFilter = !await te.UseHiddenFilter;
			const FV = await GetFolderView(Ctrl, pt);
			if (FV) {
				FV.Focus();
				FV.Refresh();
			}
		}
	};
	//Menu
	if (item.getAttribute("MenuExec")) {
		SetMenuExec("SwitchHiddenFilter", Addons.SwitchHiddenFilter.sName, item.getAttribute("Menu"), item.getAttribute("MenuPos"));
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.SwitchHiddenFilter.Exec, "Async");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.SwitchHiddenFilter.Exec, "Async");
	}

	AddEvent("Layout", async function () {
		SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.SwitchHiddenFilter.Exec(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({
			title: Addons.SwitchHiddenFilter.sName,
			src: item.getAttribute("Icon") || (WINVER >= 0xa00 ? "font:Segoe MDL2 Assets,0xe8ab" : "font:Segoe UI Emoji,0x21c4")
		}, GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16)), '</span>']);
		delete item;
	});

	AddTypeEx("Add-ons", "Switch hidden filter", Addons.SwitchHiddenFilter.Exec);
} else {
	EnableInner();
}
