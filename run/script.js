const Addon_Id = "run";
const Default = "ToolBar2Left";
const item = await GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("Menu", "Tool");
	item.setAttribute("MenuPos", -1);

	item.setAttribute("KeyOn", "List");
	item.setAttribute("Key", "F10");

	item.setAttribute("MouseOn", "List");
	item.setAttribute("Mouse", "");
}
if (window.Addon == 1) {
	Addons.Run = {
		sName: item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name,

		Exec: async function (Ctrl, pt) {
			const FV = await GetFolderView(Ctrl, pt);
			FV.Focus();
			Exec(FV, "Run dialog", "Tools", 0, pt);
		}
	}

	AddEvent("Layout", async function () {
		SetAddon(Addon_Id, Default, ['<span class="button" id="Run" onclick="Addons.Run.Exec(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({
			title: Addons.Run.sName,
			src: item.getAttribute("Icon") || "icon:shell32.dll,24"
		}, GetIconSizeEx(item)), '</span>']);
	});

	//Menu
	if (item.getAttribute("MenuExec")) {
		SetMenuExec("Run", Addons.Run.sName, item.getAttribute("Menu"), item.getAttribute("MenuPos"));
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.Run.Exec, "Async");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.Run.Exec, "Async");
	}
} else {
	EnableInner();
}
