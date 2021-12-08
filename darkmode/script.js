const Addon_Id = "darkmode";

Addons.DarkMode = {
	SetCss: function () {
		Promise.all([MainWindow.Sync.DarkMode.css, api.ShouldAppsUseDarkMode(), MainWindow.Sync.DarkMode.Auto]).then(function (r) {
			const style = document.createElement("style");
			style.media = "screen";
			if (r[2]) {
				r[0] = "@media (prefers-color-scheme: dark) {" + r[0] + "}";
			}
			style.appendChild(document.createTextNode(r[0]));
			if (r[1] || !r[2]) {
				document.head.appendChild(style);
			}
		});
	},

	SetCssIE: function () {
		const style = document.createElement("style");
		style.media = "screen";
		style.appendChild(document.createTextNode(MainWindow.Sync.DarkMode.css));
		if (window.Addons && Addons.DarkMode) {
			Addons.DarkMode.node = style;
		}
		if (MainWindow.Sync.DarkMode.bDark) {
			document.head.appendChild(style);
		}
	},

	RefreshCss: function () {
		if (MainWindow.Sync.DarkMode.bDark) {
			document.head.appendChild(Addons.DarkMode.node);
		} else {
			document.head.removeChild(Addons.DarkMode.node);
		}
	},

	InitBG: async function () {
		InitBG(await GetWinColor(window.getComputedStyle ? getComputedStyle(document.body).getPropertyValue('background-color') : document.body.currentStyle.backgroundColor));
		api.RedrawWindow(ui_.hwnd, null, 0, RDW_NOERASE | RDW_INVALIDATE | RDW_ALLCHILDREN);
	}
};

if (window.Addon == 1) {
	AddEvent("BrowserCreatedEx", (window.chrome ? Addons.DarkMode.SetCss : Addons.DarkMode.SetCssIE).toString().replace(/^[^{]+{|}$/g, ""), true);
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	SetTabContents(0, "General", '<label><input type="checkbox" id="Auto">Auto</label><br>');
}
