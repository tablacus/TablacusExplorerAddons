if (window.Addon == 1) {
	AddEvent("Load", async function (Ctrl) {
		const item = await GetAddonElement("runatsetup");
		Exec(te, item.getAttribute("Path"), item.getAttribute("Type"), ui_.hwnd);
	});
} else {
	const Addon_Id = "runatsetup";
	importScript("addons\\" + Addon_Id + "\\options.js");
}
