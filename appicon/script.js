const Addon_Id = "appicon";
const item = await GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	const src = await ExtractPath(te, item.getAttribute("Icon"));
	const image = await api.CreateObject("WICBitmap").FromFile(src);
	const hIcon = image ? await image.GetHICON() : await MakeImgIcon(src, 0, 16);
	api.SendMessage(ui_.hwnd, WM_SETICON, ICON_SMALL, hIcon);
	AddEventId("AddonDisabledEx", "appicon", async function () {
		api.SendMessage(ui_.hwnd, WM_SETICON, ICON_SMALL, await api.GetClassLongPtr(ui_.hwnd, GCLP_HICONSM));
	});
} else {
	ChangeForm([["__IconSize", "style/display", "none"]]);
}
