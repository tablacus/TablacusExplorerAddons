if (window.Addon == 1) {
	var Addon_Id = "innerup";
	var item = await GetAddonElement(Addon_Id);

	Addons.InnerUp = {
		Exec: async function (Id) {
			var FV = await GetInnerFV(Id);
			if (FV) {
				FV.Focus();
				Exec(FV, "Up", "Tabs");
			}
			return false;
		},

		Popup: async function (ev, id) {
			var FV = await GetInnerFV(id);
			if (FV) {
				FV.Focus();
				await $.FolderMenu.Clear();
				var hMenu = await api.CreatePopupMenu();
				var FolderItem = await FV.FolderItem;
				while (!await api.ILIsEmpty(FolderItem)) {
					FolderItem = await api.ILRemoveLastID(FolderItem);
					$.FolderMenu.AddMenuItem(hMenu, FolderItem);
				}
				var x = ev.screenX * ui_.Zoom;
				var y = ev.screenY * ui_.Zoom;
				var nVerb = await $.FolderMenu.TrackPopupMenu(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, x, y);
				if (nVerb) {
					$.FolderMenu.Invoke(await $.FolderMenu.Items[nVerb - 1], SBSP_SAMEBROWSER, FV);
				}
				$.FolderMenu.Clear();
			}
		}
	};

	var h = await GetIconSize(item.getAttribute("IconSize"), 16);
	var src = item.getAttribute("Icon") || (h <= 16 ? "bitmap:ieframe.dll,216,16,28" : "bitmap:ieframe.dll,214,24,28");
	Addons.InnerUp.src = ['<span class="button" onclick="return Addons.InnerUp.Exec($)" oncontextmenu="Addons.InnerUp.Popup(event, $); return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({ title: "Up", src: src }, h), '</span>'].join("");

	AddEvent("PanelCreated", function (Ctrl, Id) {
		SetAddon(null, "Inner1Left_" + Id, Addons.InnerUp.src.replace(/\$/g, Id));
	});
}
