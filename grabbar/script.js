/* Grabbar Maximized */
var Addon_Id = "grabbar";
var Default = "ToolBar1Center";

if (window.Addon == 1) {
	Addons.GrabBar =
	{
		Down: function () {
			var dt = new Date().getTime();
			if (event.button < 2) {
				if (dt - Addons.GrabBar.dt < sha.GetSystemInformation("DoubleClickTime")) {
					this.bZoom = true;
					return S_OK;
				}
				api.SendMessage(te.hwnd, 0xA1, 2, 0);
				Addons.GrabBar.dt = dt;
			}
		},

		Popup: function () {
			var pt = api.Memory("POINT");
			api.GetCursorPos(pt);
			api.PostMessage(te.hwnd, 0x313, 0, pt.x + (pt.y << 16));
			return false;
		},

		Click: function () {
			if (this.bZoom) {
				api.SendMessage(te.hwnd, WM_SYSCOMMAND, api.IsZoomed(te.hwnd) ? SC_RESTORE : SC_MAXIMIZE, 0);
				this.bZoom = false;
			}
		}
	};

	AddEvent("ChangeView", function (Ctrl) {
		if (Ctrl.Parent.Visible && Ctrl.Id == Ctrl.Parent.Selected.Id && Ctrl.Parent.Id == te.Ctrl(CTRL_TC).Id) {
			if (Addons.GrabBar.tid) {
				clearTimeout(Addons.GrabBar.tid);
			}
			Addons.GrabBar.tid = setTimeout(function () {
				delete Addons.GrabBar.tid;
				document.getElementById(Addon_Id).innerText = Ctrl.Title + ' - ' + TITLE;
			}, 99);
		}
	});

	SetAddon(Addon_Id, Default, ['<div id="grabbar" class="grabbar" unselectable="on" onclick="Addons.GrabBar.Click()" onmousedown="Addons.GrabBar.Down()" oncontextmenu="return Addons.GrabBar.Popup(this)" style="width: 100%; text-align: center; padding: 2pt; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: default"></div>']);
}
