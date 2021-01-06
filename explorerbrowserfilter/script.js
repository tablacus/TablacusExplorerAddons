const Addon_Id = "explorerbrowserfilter";
if (window.Addon == 1) {
	const item = await GetAddonElement(Addon_Id);
	te.ExplorerBrowserFilter = await ExtractFilter(item.getAttribute("Filter"));

	AddEventId("AddonDisabledEx", Addon_Id, function () {
		te.ExplorerBrowserFilter = null;
	});
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
