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
		const h = GetIconSize(item.getAttribute("IconSize"), 16);
		Addons.InnerRefresh.src = await GetImgTag({
			title: await GetText("Refresh"),
			src: item.getAttribute("Icon") || "bitmap:ieframe.dll,204,24,3"
		}, h);
	});

	AddEvent("PanelCreated", function (Ctrl, Id) {
		SetAddon(null, "Inner1Left_" + Id, ['<span class="button" onclick="return Addons.InnerRefresh.Exec(', Id, ')" oncontextmenu="return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', Addons.InnerRefresh.src, '</span>']);
	});
}
