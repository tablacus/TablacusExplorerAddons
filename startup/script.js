const Addon_Id = "startup";
if (window.Addon == 1) {
	if (await te.Data.Load < 2) {
		AddEvent("Load", async function (Ctrl) {
			const item = GetAddonElement(Addon_Id);
			if (item.getAttribute("Shift") && await api.GetKeyState(VK_SHIFT) < 0) {
				return;
			}
			const s = item.text || item.textContent || await $.GetAddonElement(Addon_Id).getAttribute("Path");
			Exec(te, s, item.getAttribute("Type"), ui_.hwnd);
		});
	}
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
