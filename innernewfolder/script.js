const Addon_Id = "innernewfolder";
if (window.Addon == 1) {
	Addons.InnerNewFolder = {
		Exec: async function (Id) {
			const FV = await GetInnerFV(Id);
			if (FV) {
				FV.Focus();
				CreateNewFolder(FV);
			}
		}
	};

	AddEvent("Layout", async function () {
		const item = await GetAddonElement(Addon_Id);
		const h = GetIconSize(item.getAttribute("IconSize"), 16);
		Addons.InnerNewFolder.src = await GetImgTag({
			title: await GetText("New folder"),
			src: item.getAttribute("Icon") || "bitmap:ieframe.dll,214,24,31"
		}, h);
	});

	AddEvent("PanelCreated", function (Ctrl, Id) {
		SetAddon(null, "Inner1Left_" + Id, ['<span class="button" onclick="Addons.InnerNewFolder.Exec(', Id, ')" oncontextmenu="return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', Addons.InnerNewFolder.src, '</span>']);
	});
}
