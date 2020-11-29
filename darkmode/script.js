const Addon_Id = "darkmode";

if (window.Addon == 1) {
	Addons.DarkMode = {
		SetCss: function () {
			var link = document.createElement("link");
			link.rel = "stylesheet";
			link.type = "text/css";
			link.href = "style.css";
			document.head.appendChild(link);
		}
	}
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
	AddEvent("BrowserCreatedEx", Addons.DarkMode.SetCss.toString().replace(/^[^{]+{|}$/g, "").replace("style\.css", await api.UrlCreateFromPath(BuildPath(ui_.Installed, "addons\\darkmode\\style.css"))), true);
}
