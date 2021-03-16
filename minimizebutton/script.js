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
			api.PostMessage(ui_.hwnd, 0x313, 0, x + (y << 16));
		}
	};

	const h = GetIconSize(item.getAttribute("IconSize"), 13);
	const src = item.getAttribute("Icon") || "font:marlett,0x30";
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.MinimizeButton.Exec(this)" oncontextmenu="return Addons.MinimizeButton.Popup(event); return false" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({ title: await api.LoadString(hShell32, 9840), src: src }, h), '</span>']);
}
