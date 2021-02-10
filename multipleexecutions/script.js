if (window.Addon == 1) {
	const Addon_Id = "multipleexecutions";
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	SetTabContents(0, "General", '<label><input type="checkbox" id="Always">' + (await api.LoadString(hShell32, 25528) || "Always").replace(/;.*/, "") + '</label><br>');
}
