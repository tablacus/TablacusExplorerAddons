const Addon_Id = "innerrefresh";
if (window.Addon == 1) {
	Addons.InnerRefresh = {
		Exec: async function (Id) {
			const FV = await GetInnerFV(Id);
			if (FV) {
				FV.Focus();
				FV.Refresh();
			}
		}
	};

	AddEvent("Layout", async function () {
		const item = await GetAddonElement(Addon_Id);
		Addons.InnerRefresh.src = await GetImgTag({
			title: await GetText("Refresh"),
			src: item.getAttribute("Icon") || "icon:browser,3"
		}, GetIconSize(item.getAttribute("IconSize"), ui_.InnerIconSize || 16));
		Addons.InnerRefresh.Position = item.getAttribute("Right") ? "Inner1Right_" : "Inner1Left_";
	});

	AddEvent("PanelCreated", function (Ctrl, Id) {
		SetAddon(null, Addons.InnerRefresh.Position + Id, ['<span class="button" onclick="return Addons.InnerRefresh.Exec(', Id, ')" oncontextmenu="return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', Addons.InnerRefresh.src, '</span>']);
	});
} else {
	SetTabContents(0, "General", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));
}
