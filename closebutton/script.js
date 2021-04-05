const Addon_Id = "closebutton";
const Default = "ToolBar1Right";
const item = await GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.CloseButton = {
		Exec: function () {
			api.SendMessage(ui_.hwnd, WM_SYSCOMMAND, SC_CLOSE, 0);
			return S_OK;
		},

		Popup: function (ev) {
			const x = ev.screenX * ui_.Zoom;
			const y = ev.screenY * ui_.Zoom;
			api.PostMessage(ui_.hwnd, 0x313, 0, x + (y << 16));
		}
	};

	AddEvent("Layout", async function () {
		SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.CloseButton.Exec()" oncontextmenu="Addons.CloseButton.Popup(event); return false" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({
			title: await api.LoadString(hShell32, 12851),
			src: item.getAttribute("Icon") || "font:marlett,0x72"
		}, GetIconSize(item.getAttribute("IconSize"), 13)), '</span>']);
	});
}
