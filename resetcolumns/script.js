const Addon_Id = "resetcolumns";
const Default = "None";
let item = await GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "File");
	item.setAttribute("MenuPos", -1);
}
if (window.Addon == 1) {
	Addons.ResetColumns = {
		sName: item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name,

		Exec: async function (Ctrl, pt) {
			const FV = await GetFolderView(Ctrl, pt);
			FV.Columns = "";
			FV.Focus();
		}
	};
	//Menu
	if (item.getAttribute("MenuExec")) {
		SetMenuExec("ResetColumns", Addons.ResetColumns.sName, item.getAttribute("Menu"), item.getAttribute("MenuPos"));
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.ResetColumns.Exec, "Async");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.ResetColumns.Exec, "Async");
	}

	AddEvent("Layout", async function () {
		SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.ResetColumns.Exec(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({
			title: Addons.ResetColumns.sName,
			src: item.getAttribute("Icon") || (WINVER >= 0xa00 ? "font:Segoe MDL2 Assets,0xe777" : "font:Segoe UI Emoji,0x27f2")
		}, GetIconSizeEx(item)), '</span>']);
		delete item;
	});

	AddTypeEx("Add-ons", "Reset Columns", Addons.ResetColumns.Exec);
} else {
	EnableInner();
}
