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
			Ctrl = await GetFolderViewEx(el);
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
		const h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
		SetAddon(Addon_Id, Default, ['<span id="mainmenubutton_$" class="button" onmousedown="Addons.MainMenuButton.Popup(this)">', await GetImgTag({
			title: await GetText("Menus"),
			src: item.getAttribute("Icon") || "font:Consolas,0x2630"
		}, h), '</span>']);
	});

	$.importScript("addons\\" + Addon_Id + "\\sync.js");

} else {
	EnableInner();
}
