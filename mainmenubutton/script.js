const Addon_Id = "mainmenubutton";
const Default = "ToolBar1Left";
const item = await GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("KeyOn", "List");
	item.setAttribute("MouseOn", "List");
}
if (window.Addon == 1) {
	Addons.MainMenuButton = {
		Popup: async function (el, Id) {
			if (!el) {
				el = document.getElementById("mainmenubutton_" + Id) || document.getElementById("mainmenubutton_$");
			}
			Ctrl = await GetFolderView(el);
			Ctrl.Focus();
			Sync.MainMenuButton.Popup(Ctrl, await GetPosEx(el, 9));
		},

		Exec: function (Ctrl, pt) {
			Sync.MainMenuButton.Popup(Ctrl, pt);
			return S_OK;
		},

		ExitMenuTimer: function (fn) {
			clearTimeout(Addons.MainMenuButton.tid);
			Addons.MainMenuButton.tid = setTimeout(fn, 500);
		}
	};

	AddEvent("Layout", async function () {
		await SetAddon(Addon_Id, Default, ['<span id="mainmenubutton_$" class="button" onmousedown="Addons.MainMenuButton.Popup(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({
			title: await GetText("Menus"),
			src: item.getAttribute("Icon") || "font:Consolas,0x2630"
		}, GetIconSizeEx(item)), '</span>']);
	});

	$.importScript("addons\\" + Addon_Id + "\\sync.js");

} else {
	EnableInner();
}
