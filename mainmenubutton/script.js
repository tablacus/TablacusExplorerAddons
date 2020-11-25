var Addon_Id = "mainmenubutton";
var Default = "ToolBar1Left";

var item = await GetAddonElement(Addon_Id);
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

	var h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	var src = item.getAttribute("Icon");
	if (src) {
		src = await GetImgTag({ title: "Main menu", src: src }, h);
	} else {
		src = '<span title="' + EncodeSC(await GetText("Main menu")) + '" style="font-size: ' + (Number(h) ? h + "px" : h) + '">&#x2630;</span>';
	}
	SetAddon(Addon_Id, Default, ['<span id="mainmenubutton_$" class="button" onmousedown="Addons.MainMenuButton.Popup(this)">', src, '</span>']);
	$.importScript("addons\\" + Addon_Id + "\\sync.js");

} else {
	EnableInner();
}
