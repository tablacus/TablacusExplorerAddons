const Addon_Id = "inactivepane";
const item = await GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	let html = await ReadTextFile("addons\\" + Addon_Id + "\\options.html");
	const darkmode = await GetAddonInfo("darkmode");
	if (darkmode) {
		html = html.replace(/Dark mode/, await darkmode.Name);
	}
	SetTabContents(0, "", html);
}
