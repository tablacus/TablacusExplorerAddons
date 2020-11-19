if (window.Addon == 1) {
	var Addon_Id = "innerback";
	var item = await GetAddonElement(Addon_Id);

	Addons.InnerBack = {
		Click: async function (Id) {
			var FV = await GetInnerFV(Id);
			if (FV) {
				FV.Focus();
				Exec(FV, "Back", "Tabs");
			}
			return false;
		},

		Popup: async function (ev, id) {
			var FV = await GetInnerFV(id);
			if (FV) {
				FV.Focus();
				var Log = await FV.History;
				var hMenu = await api.CreatePopupMenu();
				var mii = await api.Memory("MENUITEMINFO");
				mii.cbSize = await mii.Size;
				mii.fMask = MIIM_ID | MIIM_STRING | MIIM_BITMAP;
				var nCount = await  Log.Count;
				for (var i = await Log.Index + 1; i < nCount; i++) {
					var FolderItem = await Log[i];
					await AddMenuIconFolderItem(mii, FolderItem);
					mii.dwTypeData = await FolderItem.Name;
					mii.wID = i;
					await api.InsertMenuItem(hMenu, MAXINT, false, mii);
				}
				var x = ev.screenX * ui_.Zoom;
				var y = ev.screenY * ui_.Zoom;
				var nVerb = await api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, x, y, await te.hwnd, null, null);
				api.DestroyMenu(hMenu);
				if (nVerb) {
					var wFlags = await GetNavigateFlags(FV);
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
			var TC = await Ctrl.Parent;
			var o = document.getElementById("ImgBack_" + await TC.Id);
			if (o) {
				if (TC && await Ctrl.Id == await TC.Selected.Id) {
					var Log = await Ctrl.History;
					DisableImage(o, await Log && await Log.Index >= await Log.Count - 1);
				}
			}
		}
	};

	var h = await GetIconSize(item.getAttribute("IconSize"), 16);
	var src = item.getAttribute("Icon") || (h <= 16 ? "bitmap:ieframe.dll,206,16,0" : "bitmap:ieframe.dll,214,24,0");
	Addons.InnerBack.src = ['<span class="button" onclick="return Addons.InnerBack.Click($)" oncontextmenu="Addons.InnerBack.Popup(event, $); return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({ id: "ImgBack_$", title: "Back", src: src }, h), '</span>'].join("");

	AddEvent("PanelCreated", function (Ctrl, Id) {
		SetAddon(null, "Inner1Left_" + Id, Addons.InnerBack.src.replace(/\$/g, Id));
	});

	AddEvent("ChangeView", Addons.InnerBack.ChangeView);
}
