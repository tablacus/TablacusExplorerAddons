var Addon_Id = "color";

if (window.Addon == 1) {
	importJScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	await SetTabContents(0, "", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));
	document.F.Default.placeholder = GetWebColor(await api.GetSysColor(COLOR_WINDOWTEXT));
	document.F.Background.placeholder = GetWebColor(await api.GetSysColor(COLOR_WINDOW));
}
