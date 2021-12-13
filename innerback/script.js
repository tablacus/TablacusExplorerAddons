const Addon_Id = "innerback";
if (window.Addon == 1) {
	Addons.InnerBack = {
		Click: async function (Id) {
			const FV = await GetInnerFV(Id);
			if (FV) {
				FV.Focus();
				Exec(FV, "Back", "Tabs");
			}
			return false;
		},

		Popup: async function (el, id) {
			const FV = await GetInnerFV(id);
			if (FV) {
				FV.Focus();
				const Log = await FV.History;
				const hMenu = await api.CreatePopupMenu();
				const mii = await api.Memory("MENUITEMINFO");
				mii.fMask = MIIM_ID | MIIM_STRING | MIIM_BITMAP;
				const nCount = await  Log.Count;
				for (let i = await Log.Index + 1; i < nCount; i++) {
					const FolderItem = await Log[i];
					await AddMenuIconFolderItem(mii, FolderItem);
					mii.dwTypeData = await FolderItem.Name;
					mii.wID = i;
					await api.InsertMenuItem(hMenu, MAXINT, false, mii);
				}
				const pt = GetPos(el, 9);
				const nVerb = await api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, ui_.hwnd, null, null);
				api.DestroyMenu(hMenu);
				if (nVerb) {
					const wFlags = await GetNavigateFlags(FV);
					if (wFlags & SBSP_NEWBROWSER) {
						FV.Navigate(await Log[nVerb], wFlags);
					} else {
						Log.Index = nVerb;
						FV.History = Log;
					}
				}
			}
		},

		ChangeView: async function (Ctrl) {
			const TC = await Ctrl.Parent;
			const o = document.getElementById("ImgBack_" + await TC.Id);
			if (o) {
				if (TC && await Ctrl.Id == await TC.Selected.Id) {
					const Log = await Ctrl.History;
					DisableImage(o, await Log && await Log.Index >= await Log.Count - 1);
				}
			}
		}
	};

	AddEvent("Layout", async function () {
		const item = await GetAddonElement(Addon_Id);
		Addons.InnerBack.src = ['<span class="button" onclick="return Addons.InnerBack.Click($)" oncontextmenu="Addons.InnerBack.Popup(this, $); return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({
			id: "ImgBack_$",
			title: await GetText("Back"),
			src: item.getAttribute("Icon") || "icon:general,0"
		}, GetIconSize(item.getAttribute("IconSize"), ui_.InnerIconSize || 16)), '</span>'].join("");
	});

	AddEvent("PanelCreated", function (Ctrl, Id) {
		SetAddon(null, "Inner1Left_" + Id, Addons.InnerBack.src.replace(/\$/g, Id));
	});

	AddEvent("ChangeView", Addons.InnerBack.ChangeView);
}
