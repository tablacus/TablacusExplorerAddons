const Addon_Id = "windowalpha";
const item = GetAddonElement(Addon_Id);
const alpha = item.getAttribute("Alpha") || 230;

if (window.Addon == 1) {
	AddEvent("Arrange", async function (Ctrl, rc) {
		SetWindowAlpha(ui_.hwnd, alpha);
		ui_.Show = 2;
	});
} else {
	SetTabContents(0, "", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));
	document.getElementById('AlphaValue').textContent = alpha;
	document.querySelector("input[name='alpha']").value = alpha;
}