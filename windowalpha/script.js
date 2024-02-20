const Addon_Id = "windowalpha";
const item = GetAddonElement(Addon_Id);

if (window.Addon == 1) {
	AddEvent("Arrange", async function (Ctrl, rc) {
		SetWindowAlpha(ui_.hwnd, item.getAttribute("Alpha") || 230);
		ui_.Show = 2;
	});
} else {
	SetTabContents(0, "", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));
	document.getElementById('rangeValue').textContent = item.getAttribute("Alpha");
}