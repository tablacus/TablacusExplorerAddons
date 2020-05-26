/* Grabbar Maximized */
var Addon_Id = "grabbar";
var Default = "ToolBar1Center";

if (window.Addon == 1) {
	Addons.GrabBar =
	{
		MMove: false,
		pt: api.Memory("POINT"),
		dv: api.Memory("RECT"),
		div: document.createElement("div"),

		Down: function () {
			if (event.button == 0) {
				api.GetCursorPos(this.pt);
			} else {
				this.pt.x = this.pt.y = 0;
			}
		},

		Move: function () {
			if (this.Check() && this.pt.x + this.pt.y > 0 && !this.MMove) {
				this.MMove = true;
				var rec = api.Memory("RECT");
				api.GetWindowRect(te.hwnd, rec);
				if (api.IsZoomed(te.hwnd)) {
					var x = rec.left + 8;
					var y = rec.top + 8;
					this.dv.left = (this.pt.x - x) / (rec.right - x) * 1000;
					api.SendMessage(te.hwnd, WM_SYSCOMMAND, SC_RESTORE, 0);
					api.GetWindowRect(te.hwnd, rec);
					this.dv.left = (rec.right - rec.left) * this.dv.left / 1000;
					this.dv.top = this.pt.y + 5 - y;
				} else {
					this.dv.left = this.pt.x - rec.left;
					this.dv.top = this.pt.y - rec.top;
				}
				this.dv.right = rec.right - rec.left;
				this.dv.bottom = rec.bottom - rec.top;
				setTimeout(this.MoveMonit,25);
			}
		},

		MoveMonit: function() {
			if (Addons.GrabBar.Check()) {
				api.GetCursorPos(Addons.GrabBar.pt);
				api.MoveWindow(te.hwnd, Addons.GrabBar.pt.x - Addons.GrabBar.dv.left, Addons.GrabBar.pt.y - Addons.GrabBar.dv.top, Addons.GrabBar.dv.right, Addons.GrabBar.dv.bottom, true);
				setTimeout(Addons.GrabBar.MoveMonit,25);
			} else {
				Addons.GrabBar.MMove = false;
			}
		},

		Max: function () {
			api.SendMessage(te.hwnd, WM_SYSCOMMAND, api.IsZoomed(te.hwnd) ? SC_RESTORE : SC_MAXIMIZE, 0);
			return S_OK;
		},

		Check: function () {
			return api.GetKeyState(VK_LBUTTON) < 0;
		},

		Popup: function () {
			var pt = api.Memory("POINT");
			api.GetCursorPos(pt);
			api.PostMessage(te.hwnd, 0x313, 0, pt.x + (pt.y << 16));
			return false;
		}
	};

	AddEvent("ChangeView", function (Ctrl) {
		try {
			setTimeout(function () {
				if (Ctrl.Id == Ctrl.Parent.Selected.Id && Ctrl.Parent.Id == te.Ctrl(CTRL_TC).Id) {
					document.getElementById(Addon_Id).innerText = Ctrl.Title + ' - Tablacus Explorer';
				}
			}, 99);
		} catch (e) { }
	});

	SetAddon(Addon_Id, Default, ['<div id="grabbar" class="grabbar" unselectable="on" ondblclick="Addons.GrabBar.Max()" onmousedown="Addons.GrabBar.Down()" onmousemove="Addons.GrabBar.Move()" oncontextmenu="return Addons.GrabBar.Popup(this)" style="width: 100%; text-align: center; padding: 2pt; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: default"></div>']);
	Addons.GrabBar.div = document.getElementById(Addon_Id);
}
