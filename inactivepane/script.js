const Addon_Id = "inactivepane";
const item = await GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	Addons.InactivePane = {
		IsDark: async function () {
			const cl = await MainWindow.GetSysColor(COLOR_WINDOW);
			return (cl & 0xff) * 299 + (cl & 0xff00) * 2.29296875 + (cl & 0xff0000) * 0.001739501953125 < 127500;
		}
	}
	SetTabContents(0, "", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));
	const bDark = await Addons.InactivePane.IsDark();
	document.getElementById("TextColor").setAttribute("placeholder", GetWebColor(bDark ? 0xaaaaaa : 0x444444));
	document.getElementById("Color").setAttribute("placeholder", GetWebColor(bDark ? 0x444444 : 0xaaaaaa));
}
