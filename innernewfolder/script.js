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
		Addons.InnerNewFolder.src = await GetImgTag({
			title: await GetText("New folder"),
			src: item.getAttribute("Icon") || "icon:general,31"
		}, GetIconSize(item.getAttribute("IconSize"), ui_.InnerIconSize || 16));
	});

	AddEvent("PanelCreated", function (Ctrl, Id) {
		SetAddon(null, "Inner1Left_" + Id, ['<span class="button" onclick="Addons.InnerNewFolder.Exec(', Id, ')" oncontextmenu="return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', Addons.InnerNewFolder.src, '</span>']);
	});
}
