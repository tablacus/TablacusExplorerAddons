if (window.Addon == 1) {
	const Addon_Id = "innerrefresh";
	const item = await GetAddonElement(Addon_Id);
	const h = GetIconSize(item.getAttribute("IconSize"), 16);
	const s = item.getAttribute("Icon") || (h <= 16 ? "bitmap:ieframe.dll,216,16,31" : "icon:shell32.dll,205,32");

	Addons.InnerNewFolder = {
		src: await GetImgTag({ title: "New folder", src: s }, h),

		Exec: async function (Id) {
			const FV = await GetInnerFV(Id);
			if (FV) {
				FV.Focus();
				CreateNewFolder(FV);
			}
		}
	};

	AddEvent("PanelCreated", function (Ctrl, Id) {
		SetAddon(null, "Inner1Left_" + Id, ['<span class="button" onclick="Addons.InnerNewFolder.Exec(', Id, ')" oncontextmenu="return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', Addons.InnerNewFolder.src, '</span>']);
	});
}
