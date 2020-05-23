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
				this.pt.X = this.pt.Y = 0;
			}
		},

		Move: function () {
			if (this.Check() && this.pt.X + this.pt.Y > 0 && !this.MMove) {
				this.MMove = true;
				var rec = api.Memory("RECT");
				api.GetWindowRect(te.hwnd, rec);
				if (api.IsZoomed(te.hwnd)) {
					this.dv.Left = this.pt.X / rec.Right * 1000;
					api.SendMessage(te.hwnd, WM_SYSCOMMAND, SC_RESTORE, 0);
					api.GetWindowRect(te.hwnd, rec);
					this.dv.Left = (rec.Right - rec.Left) * this.dv.Left / 1000;
					this.dv.Top = this.pt.Y + 5;
				} else {
					this.dv.Left = this.pt.X - rec.Left;
					this.dv.Top = this.pt.Y - rec.Top;
				}
				this.dv.Right = rec.Right - rec.Left;
				this.dv.Bottom = rec.Bottom - rec.Top;
				setTimeout(this.MoveMonit,25);
			}
		},

		MoveMonit: function() {
			if (Addons.GrabBar.Check()) {
				api.GetCursorPos(Addons.GrabBar.pt);
				api.MoveWindow(te.hwnd, Addons.GrabBar.pt.X - Addons.GrabBar.dv.Left, Addons.GrabBar.pt.Y - Addons.GrabBar.dv.Top, Addons.GrabBar.dv.Right, Addons.GrabBar.dv.Bottom, true);
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
			return getComputedStyle(this.div).getPropertyValue('cursor') == 'default';
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

	if (!window.getComputedStyle) {
		Addons.GrabBar.Check = function () {
			return this.div.currentStyle.cursor == 'default';
		}
	}

	SetAddon(Addon_Id, Default, ['<style>div.grabbar:active{cursor:default;}</style><div id="grabbar" class="grabbar" unselectable="on" ondblclick="Addons.GrabBar.Max()" onmousedown="Addons.GrabBar.Down()" onmousemove="Addons.GrabBar.Move()" oncontextmenu="return Addons.GrabBar.Popup(this)" style="width: 100%; text-align: center; padding: 2pt; white-space: nowrap; overflow: hidden; text-overflow: ellipsis"></div>']);
	Addons.GrabBar.div = document.getElementById(Addon_Id);
}
