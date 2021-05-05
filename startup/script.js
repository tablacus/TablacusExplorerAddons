if (window.Addon == 1) {
	if (await te.Data.Load < 2) {
		AddEvent("Load", async function (Ctrl) {
			const item = await GetAddonElement('startup');
			if (item.getAttribute("Shift") && await api.GetKeyState(VK_SHIFT) < 0) {
				return;
			}
			Exec(te, item.getAttribute("Path"), item.getAttribute("Type"), ui_.hwnd);
		});
	}
} else {
	const Addon_Id = "startup";
	importScript("addons\\" + Addon_Id + "\\options.js");
}
