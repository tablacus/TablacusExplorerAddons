var Addon_Id = "darkmode";

if (window.Addon == 1) {
	Addons.DarkMode = {
		SetCss: async function () {
			var link = document.createElement("link");
			link.rel = "stylesheet";
			link.type = "text/css";
			link.href = await MainWindow.Sync.DarkMode.css;
			document.head.appendChild(link);
		}
	}
	importJScript("addons\\" + Addon_Id + "\\sync.js");
	AddEvent("BrowserCreatedEx", Addons.DarkMode.SetCss.toString().replace(/^[^{]+{|}$/g, ""), true);
}
