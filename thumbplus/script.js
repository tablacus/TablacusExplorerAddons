const Addon_Id = "thumbplus";
if (window.Addon == 1) {
	if (WINVER >= 0x600 && await api.IsAppThemed()) {
		AddEvent("Load", function () {
			if (!Addon.ClassicStyle) {
				api.ObjPutI(Sync.ThumbPlus, "fStyle", LVIS_CUT);
			}
		});
	}
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	SetTabContents(0, "", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));
}
