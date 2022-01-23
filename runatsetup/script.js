const Addon_Id = "runatsetup";
if (window.Addon == 1) {
	AddEvent("Load", async function (Ctrl) {
		const item = GetAddonElement(Addon_Id);
		const s = item.text || item.textContent || await $.GetAddonElement(Addon_Id).getAttribute("Path");
		Exec(te, s, item.getAttribute("Type"), ui_.hwnd);
	});
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
