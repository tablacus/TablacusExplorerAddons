const Addon_Id = "teracopy";
if (window.Addon == 1) {
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	SetTabContents(0, "General", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));
	setTimeout(async function () {
		document.getElementById("GetTeraCopy").value = await api.sprintf(999, await GetText("Get %s..."), "TeraCopy");
	}, 99);
}
