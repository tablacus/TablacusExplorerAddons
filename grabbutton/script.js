const Addon_Id = "grabbutton";
const Default = "ToolBar1Left";
if (window.Addon == 1) {
	Common.GrabButton = await api.CreateObject("Object");
	Common.GrabButton.pt = await api.Memory("POINT");

	Addons.GrabButton = {
		Grab: function (ev) {
			let dt = new Date().getTime();
			if ((ev.buttons != null ? ev.buttons : ev.button) == 1) {
				if (dt - Addons.GrabButton.dt < ui_.DoubleClickTime) {
					this.bZoom = true;
					return S_OK;
				}
				Addons.GrabButton.dt = dt;
				Common.GrabButton.pt.x = ev.screenX * ui_.Zoom;
				Common.GrabButton.pt.y = ev.screenY * ui_.Zoom;
				api.SetCapture(ui_.hwnd);
				Common.GrabButton.Capture = true;
			}
		},

		Popup: function (ev) {
			const x = ev.screenX * ui_.Zoom;
			const y = ev.screenY * ui_.Zoom;
			api.PostMessage(ui_.hwnd, 0x313, 0, x + (y << 16));
		},

		Click: async function () {
			if (this.bZoom) {
				api.SendMessage(ui_.hwnd, WM_SYSCOMMAND, await api.IsZoomed(ui_.hwnd) ? SC_RESTORE : SC_MAXIMIZE, 0);
				this.bZoom = false;
			}
		}
	};

	AddEvent("Layout", async function () {
		const item = await GetAddonElement(Addon_Id);
		SetAddon(Addon_Id, Default, ['<span id="grabbutton" class="button" onmousedown="Addons.GrabButton.Grab(event)" onclick="Addons.GrabButton.Click()" oncontextmenu="Addons.GrabButton.Popup(event); return false;">', await GetImgTag({
			title: "Tablacus Explorer",
			src: item.getAttribute("Icon") || "icon:" + ui_.TEPath + ",0"
		}, GetIconSize(item.getAttribute("IconSize"), 16)), '</span>']);
	});
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
}
