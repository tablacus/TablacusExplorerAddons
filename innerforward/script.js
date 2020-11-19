if (window.Addon == 1) {
	var Addon_Id = "innerback";
	var item = await GetAddonElement(Addon_Id);

	Addons.InnerForward = {
		Click: async function (Id) {
			var FV = await GetInnerFV(Id);
			if (FV) {
				FV.Focus();
				Exec(FV, "Forward", "Tabs");
			}
			return false;
		},

		Popup: async function (ev, Id) {
			var FV = await GetInnerFV(Id);
			if (FV) {
				FV.Focus();
				var Log = await FV.History;
				var hMenu = await api.CreatePopupMenu();
				var mii = await api.Memory("MENUITEMINFO");
				mii.cbSize = await mii.Size;
				mii.fMask = MIIM_ID | MIIM_STRING | MIIM_BITMAP;
				for (var i = await Log.Index; i-- > 0;) {
					var FolderItem = await Log[i];
					await AddMenuIconFolderItem(mii, FolderItem);
					mii.dwTypeData = await FolderItem.Name;
					mii.wID = i + 1;
					await api.InsertMenuItem(hMenu, MAXINT, false, mii);
				}
				var x = ev.screenX * ui_.Zoom;
				var y = ev.screenY * ui_.Zoom;
				var nVerb = await api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, x, y, await te.hwnd, null, null);
				api.DestroyMenu(hMenu);
				if (nVerb) {
					var wFlags = await GetNavigateFlags(FV);
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
			var TC = await Ctrl.Parent;
			var o = document.getElementById("ImgForward_" + await TC.Id);
			if (o) {
				if (TC && await Ctrl.Id == await TC.Selected.Id) {
					var Log = await Ctrl.History;
					DisableImage(o, Log && await Log.Index < 1);
				}
			}
		}
	};

	var h = await GetIconSize(item.getAttribute("IconSize"), 16);
	var src = item.getAttribute("Icon") || (h <= 16 ? "bitmap:ieframe.dll,206,16,1" : "bitmap:ieframe.dll,214,24,1");
	Addons.InnerForward.src = ['<span class="button" onclick="return Addons.InnerForward.Click($)" oncontextmenu="Addons.InnerForward.Popup(event, $); return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({ id: "ImgForward_$", title: "Forward", src: src }, h), '</span>'].join("");

	AddEvent("PanelCreated", function (Ctrl, Id) {
		SetAddon(null, "Inner1Left_" + Id, Addons.InnerForward.src.replace(/\$/g, Id));
	});

	AddEvent("ChangeView", Addons.InnerForward.ChangeView);
}
