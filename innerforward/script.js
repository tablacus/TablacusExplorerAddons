const Addon_Id = "innerforward";
if (window.Addon == 1) {
	Addons.InnerForward = {
		Click: async function (Id) {
			const FV = await GetInnerFV(Id);
			if (FV) {
				FV.Focus();
				Exec(FV, "Forward", "Tabs");
			}
			return false;
		},

		Popup: async function (el, Id) {
			const FV = await GetInnerFV(Id);
			if (FV) {
				FV.Focus();
				const Log = await FV.History;
				const hMenu = await api.CreatePopupMenu();
				const mii = await api.Memory("MENUITEMINFO");
				mii.fMask = MIIM_ID | MIIM_STRING | MIIM_BITMAP;
				for (let i = await Log.Index; i-- > 0;) {
					const FolderItem = await Log[i];
					await AddMenuIconFolderItem(mii, FolderItem);
					mii.dwTypeData = await FolderItem.Name;
					mii.wID = i + 1;
					await api.InsertMenuItem(hMenu, MAXINT, false, mii);
				}
				const pt = GetPos(el, 9);
				const nVerb = await api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, ui_.hwnd, null, null);
				api.DestroyMenu(hMenu);
				if (nVerb) {
					const wFlags = await GetNavigateFlags(FV);
					if (wFlags & SBSP_NEWBROWSER) {
						FV.Navigate(await Log[nVerb - 1], wFlags);
					} else {
						Log.Index = nVerb - 1;
						FV.History = Log;
					}
				}
			}
		},

		ChangeView: async function (Ctrl) {
			const TC = await Ctrl.Parent;
			const o = document.getElementById("ImgForward_" + await TC.Id);
			if (o) {
				if (TC && await Ctrl.Id == await TC.Selected.Id) {
					const Log = await Ctrl.History;
					DisableImage(o, Log && await Log.Index < 1);
				}
			}
		}
	};

	AddEvent("Layout", async function () {
		const item = await GetAddonElement(Addon_Id);
		Addons.InnerForward.src = ['<span class="button" onclick="return Addons.InnerForward.Click($)" oncontextmenu="Addons.InnerForward.Popup(this, $); return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({
			id: "ImgForward_$",
			title: await GetText("Forward"),
			src: item.getAttribute("Icon") || "icon:general,1"
		}, GetIconSize(item.getAttribute("IconSize"), ui_.InnerIconSize || 16)), '</span>'].join("");
	});

	AddEvent("PanelCreated", function (Ctrl, Id) {
		SetAddon(null, "Inner1Left_" + Id, Addons.InnerForward.src.replace(/\$/g, Id));
	});

	AddEvent("ChangeView", Addons.InnerForward.ChangeView);
}
