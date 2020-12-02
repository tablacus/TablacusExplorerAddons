const Addon_Id = "emulatedrop";
if (window.Addon == 1) {
	Addons.EmulateDrop = {
		MouseUp: function () {
			Sync.EmulateDrop.tid = setTimeout(async function () {
				api.mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
				Sync.EmulateDrop.tid = null;
			}, 99);
		}
	}
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
}
