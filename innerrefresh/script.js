if (window.Addon == 1) {
	const Addon_Id = "innerrefresh";
	const item = await GetAddonElement(Addon_Id);
	const h = GetIconSize(item.getAttribute("IconSize"), 16);
	const s = item.getAttribute("Icon") || (h <= 16 ? "bitmap:ieframe.dll,206,16,3" : "bitmap:ieframe.dll,204,24,3");

	Addons.InnerRefresh = {
		src: await GetImgTag({ title: "Refresh", src: s }, h),

		Exec: async function (Id) {
			const FV = await GetInnerFV(Id);
			if (FV) {
				FV.Focus();
				FV.Refresh();
			}
		}
	};

	AddEvent("PanelCreated", function (Ctrl, Id) {
		SetAddon(null, "Inner1Left_" + Id, ['<span class="button" onclick="return Addons.InnerRefresh.Exec(', Id, ')" oncontextmenu="return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', Addons.InnerRefresh.src, '</span>']);
	});
}
