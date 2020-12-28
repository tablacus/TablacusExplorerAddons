const Addon_Id = "iconoverlay";
if (window.Addon == 1) {
	Addons.IconOverlay = {
		Redraw: function () {
			if (Addons.IconOverlay.tid) {
				clearTimeout(Addons.IconOverlay.tid);
			}
			Addons.IconOverlay.tid = setTimeout(function () {
				delete Addons.IconOverlay.tid;
				api.RedrawWindow(ui_.hwnd, null, 0, RDW_INVALIDATE | RDW_FRAME | RDW_ALLCHILDREN);
			}, 500);
		}
	};
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	SetTabContents(0, "General", '<label>Base</label><br><input type="text" id="Base" placeholder="11" style="width: 100%">');
}
