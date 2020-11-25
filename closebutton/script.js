var Addon_Id = "closebutton";
var Default = "ToolBar1Right";

var item = await GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.CloseButton = {
		Exec: function () {
			api.SendMessage(ui_.hwnd, WM_SYSCOMMAND, SC_CLOSE, 0);
			return S_OK;
		},

		Popup: function (ev) {
			var x = ev.screenX * ui_.Zoom;
			var y = ev.screenY * ui_.Zoom;
			api.PostMessage(te.hwnd, 0x313, 0, x + (y << 16));
		}
	};

	var h = GetIconSize(item.getAttribute("IconSize"));
	var src = item.getAttribute("Icon");
	if (src) {
		src = await GetImgTag({ title: await api.LoadString(hShell32, 12851), src: src }, h);
	} else {
		var fh = "";
		if (item.getAttribute("IconSize")) {
			fh = '; font-size:' + (Number(h) ? h + "px" : h);
		}
		src = '<span title="' + await api.LoadString(hShell32, 12851) + '" style="font-family: marlett' + fh + '">&#x72;</span>';
	}
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.CloseButton.Exec()" oncontextmenu="Addons.CloseButton.Popup(event); return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', src, '</span>']);
}
