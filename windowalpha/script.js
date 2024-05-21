const Addon_Id = "windowalpha";
const item = GetAddonElement(Addon_Id);
const Alpha = item.getAttribute("Alpha") || 230;

if (window.Addon == 1) {
	AddEvent("Arrange", async function (Ctrl, rc) {
		SetWindowAlpha(ui_.hwnd, Alpha);
		ui_.Show = 2;
	});
} else {
	SetTabContents(0, "", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));
	document.getElementById('rangeValue').textContent = Alpha;
	document.querySelector("#panel0 > input[type=range]").value = Alpha;
}