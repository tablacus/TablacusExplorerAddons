const Addon_Id = "minimizebutton";
const Default = "ToolBar1Right";

const item = await GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.MinimizeButton = {
		Exec: function () {
			api.SendMessage(ui_.hwnd, WM_SYSCOMMAND, SC_MINIMIZE, 0);
			return S_OK;
		},

		Popup: function (ev) {
			const x = ev.screenX * ui_.Zoom;
			const y = ev.screenY * ui_.Zoom;
			api.PostMessage(te.hwnd, 0x313, 0, x + (y << 16));
			return false;
		}
	};

	const h = GetIconSize(item.getAttribute("IconSize"));
	let src = item.getAttribute("Icon");
	if (src) {
		src = await GetImgTag({ title: await api.LoadString(hShell32, 9840), src: src }, h);
	} else {
		let fh = "";
		if (item.getAttribute("IconSize")) {
			fh = '; font-size:' + (Number(h) ? h + "px" : h);
		}
		src = '<span title="' + await api.LoadString(hShell32, 9840) + '" style="font-family: marlett' + fh + '">&#x30;</span>';
	}
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.MinimizeButton.Exec(this)" oncontextmenu="return Addons.MinimizeButton.Popup(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', src, '</span>']);
}
