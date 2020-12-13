const Addon_Id = "folderlargeicon";
if (window.Addon == 1) {
	if (WINVER >= 0x600 && await api.IsAppThemed()) {
		AddEvent("Load", function () {
			if (!Addons.ClassicStyle) {
				Sync.FolderLargeIcon.SetStyle();
			}
		});
	}
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
}
