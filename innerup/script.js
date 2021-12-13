const Addon_Id = "innerup";
if (window.Addon == 1) {
	Addons.InnerUp = {
		Exec: async function (Id) {
			const FV = await GetInnerFV(Id);
			if (FV) {
				FV.Focus();
				Exec(FV, "Up", "Tabs");
			}
			return false;
		},

		Popup: async function (ev, id) {
			const FV = await GetInnerFV(id);
			if (FV) {
				FV.Focus();
				await FolderMenu.Clear();
				const hMenu = await api.CreatePopupMenu();
				let FolderItem = await FV.FolderItem;
				while (!await api.ILIsEmpty(FolderItem)) {
					FolderItem = await api.ILRemoveLastID(FolderItem);
					FolderMenu.AddMenuItem(hMenu, FolderItem);
				}
				const x = ev.screenX * ui_.Zoom;
				const y = ev.screenY * ui_.Zoom;
				const nVerb = await FolderMenu.TrackPopupMenu(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, x, y);
				if (nVerb) {
					FolderMenu.Invoke(await FolderMenu.Items[nVerb - 1], SBSP_SAMEBROWSER, FV);
				}
				FolderMenu.Clear();
			}
		}
	};

	AddEvent("Layout", async function () {
		const item = await GetAddonElement(Addon_Id);
		Addons.InnerUp.src = ['<span class="button" onclick="return Addons.InnerUp.Exec($)" oncontextmenu="Addons.InnerUp.Popup(event, $); return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({
			id: "iImgUp_$",
			title: await GetText("Up"),
			src: item.getAttribute("Icon") || "icon:general,28"
		}, GetIconSize(item.getAttribute("IconSize"), ui_.InnerIconSize || 16)), '</span>'].join("");
	});

	AddEvent("PanelCreated", function (Ctrl, Id) {
		SetAddon(null, "Inner1Left_" + Id, Addons.InnerUp.src.replace(/\$/g, Id));
	});

	AddEvent("ChangeView2", async function (Ctrl) {
		DisableImage(document.getElementById("iImgUp_" + await Ctrl.Parent.Id), await api.ILIsEmpty(Ctrl));
	});
}
