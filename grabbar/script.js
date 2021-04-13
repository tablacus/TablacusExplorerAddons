/* Grabbar Maximized */
const Addon_Id = "grabbar";
const Default = "ToolBar1Center";
if (window.Addon == 1) {
	Common.GrabBar = await api.CreateObject("Object");
	Common.GrabBar.pt = await api.Memory("POINT");

	Addons.GrabBar = {
		Down: function (ev) {
			const dt = new Date().getTime();
			if ((ev.buttons != null ? ev.buttons : ev.button) == 1) {
				if (dt - Addons.GrabBar.dt < ui_.DoubleClickTime) {
					this.bZoom = true;
					return S_OK;
				}
				Addons.GrabBar.dt = dt;
				if (window.chrome || api.IsZoomed(ui_.hwnd)) {
					Common.GrabBar.pt.x = ev.screenX * ui_.Zoom;
					Common.GrabBar.pt.y = ev.screenY * ui_.Zoom;
					api.SetCapture(ui_.hwnd);
					Common.GrabBar.Capture = true;
					return S_OK;
				}
				api.SendMessage(ui_.hwnd, 0xA1, 2, 0);
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

	AddEvent("Layout", function () {
		SetAddon(Addon_Id, Default, ['<div id="grabbar" class="grabbar" unselectable="on" onclick="Addons.GrabBar.Click()" onmousedown="return Addons.GrabBar.Down(event)" oncontextmenu="Addons.GrabBar.Popup(event); return false;" style="width: 100%; text-align: center; padding: 2pt; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: default">', TITLE, '</div>']);
	});

	AddEvent("ChangeView1", async function (Ctrl) {
		document.getElementById(Addon_Id).innerText = await Ctrl.Title + ' - ' + TITLE;
	});

	$.importScript("addons\\" + Addon_Id + "\\sync.js");
}
