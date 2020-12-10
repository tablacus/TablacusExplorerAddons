if (window.Addon == 1) {
	AddEvent("Load", async function (Ctrl) {
		const item = await GetAddonElement("runatsetup");
		const s = item.getAttribute("Type");
		if (/^Open$|^Open in New Tab$|^Open in Background$/.test(s)) {
			setTimeout(function (strPath, strType) {
				Exec(te, strPath, strType, ui_.hwnd);
			}, 999, item.getAttribute("Path"), s);
		} else {
			Exec(te, item.getAttribute("Path"), s, ui_.hwnd);
		}
	});
} else {
	const Addon_Id = "runatsetup";
	importScript("addons\\" + Addon_Id + "\\options.js");
}
