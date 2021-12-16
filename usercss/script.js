const Addons_Id = "usercss";
if (window.Addon == 1) {
	AddEvent("BrowserCreatedEx", async function () {
		const style = document.createElement("style");
		style.media = "screen";
		style.appendChild(document.createTextNode(await ReadTextFile(BuildPath(await te.Data.DataFolder, "config\\user.css"))));
		document.head.appendChild(style);
	}.toString().replace(/^[^{]+{|}$/g, ""));
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
