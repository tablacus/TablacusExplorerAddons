const Addon_Id = "adsthumb";
if (window.Addon == 1) {
	if (WINVER >= 0x600 && await api.IsAppThemed()) {
		AddEvent("Load", function () {
			if (!Addons.ClassicStyle) {
				Sync.ADSThumb.SetStyle();
			}
		});
	}
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
}
