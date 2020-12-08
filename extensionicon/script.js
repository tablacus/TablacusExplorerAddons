const Addon_Id = "extensionicon";
if (window.Addon == 1) {
	if (WINVER >= 0x600 && await api.IsAppThemed()) {
		AddEvent("Load", function () {
			if (!Addons.ClassicStyle) {
				api.ObjPutI(Sync.ExtensionIcon, "fStyle", LVIS_CUT);
			}
		});
	}
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
