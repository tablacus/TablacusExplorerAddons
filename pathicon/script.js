const Addon_Id = "pathicon";
if (window.Addon == 1) {
	if (WINVER >= 0x600 && await api.IsAppThemed()) {
		AddEvent("Load", function () {
			if (!Addons.ClassicStyle) {
				api.ObjPutI(Sync.PathIcon, "fStyle", LVIS_CUT);
			}
		});
	}
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	arIndex = ["Path", "Small", "Large"];
	importScript("addons\\" + Addon_Id + "\\options.js");
}
