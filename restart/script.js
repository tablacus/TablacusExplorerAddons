const Addon_Id = "restart";
const Default = "None";
let item = await GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "File");
	item.setAttribute("MenuPos", -1);
}
if (window.Addon == 1) {
	Addons.Restart = {
		sName: item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name,

		Exec: async function () {
			await FinalizeUI();
			te.Reload(true);
		}
	};
	//Menu
	if (item.getAttribute("MenuExec")) {
		SetMenuExec("Restart", Addons.Restart.sName, item.getAttribute("Menu"), item.getAttribute("MenuPos"));
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.Restart.Exec, "Async");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.Restart.Exec, "Async");
	}

	AddEvent("Layout", async function () {
		SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.Restart.Exec()" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({
			title: item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name,
			src: item.getAttribute("Icon") || (WINVER >= 0xa00 ? "font:Segoe MDL2 Assets,0xe777" : "font:Segoe UI Emoji,0x27f2")
		}, GetIconSizeEx(item)), '</span>']);
		delete item;
	});

	AddTypeEx("Add-ons", "Restart", Addons.Restart.Exec);
} else {
	EnableInner();
}
