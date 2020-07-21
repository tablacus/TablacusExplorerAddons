var Addon_Id = "grabbutton";
var Default = "ToolBar1Left";

var item = GetAddonElement(Addon_Id);

if (window.Addon == 1) {
	Addons.GrabButton =
	{
		Grab: function () {
			var dt = new Date().getTime();
			if (event.button < 2) {
				if (dt - Addons.GrabButton.dt < sha.GetSystemInformation("DoubleClickTime")) {
					this.bZoom = true;
					return S_OK;
				}
				api.SendMessage(te.hwnd, 0xA1, 2, 0);
				Addons.GrabButton.dt = dt;
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

	var src = item.getAttribute("Icon") || "icon:" + api.GetModuleFileName(null) + ",0";
	SetAddon(Addon_Id, Default, ['<span id="grabbutton" class="button" onmousedown="Addons.GrabButton.Grab()" onclick="Addons.GrabButton.Click()" oncontextmenu="return Addons.GrabButton.Popup(this)">', GetImgTag({ title: "Tablacus Explorer", src: src }, GetIconSize(item.getAttribute("IconSize"), 16)), '</span>']);
}
