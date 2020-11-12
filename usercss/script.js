var Addons_Id = "usercss";
if (window.Addon == 1) {
	AddEvent("BrowserCreatedEx", async function () {
		var link = document.createElement("link");
		link.rel = "stylesheet";
		link.type = "text/css";
		link.href = await api.UrlCreateFromPath(BuildPath(await te.Data.DataFolder, "config\\user.css"));
		document.head.appendChild(link);
	}.toString().replace(/^[^{]+{|}$/g, ""));
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
