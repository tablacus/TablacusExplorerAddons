if (window.Addon == 1) {
	Addons.InnerBack =
	{
		Click: function (Id) {
			var FV = GetInnerFV(Id);
			if (FV) {
				FV.Focus();
				Exec(FV, "Back", "Tabs");
			}
			return false;
		},

		Popup: function (o, id) {
			var FV = GetInnerFV(id);
			if (FV) {
				FV.Focus();
				var Log = FV.History;
				var hMenu = api.CreatePopupMenu();
				var mii = api.Memory("MENUITEMINFO");
				mii.cbSize = mii.Size;
				mii.fMask = MIIM_ID | MIIM_STRING | MIIM_BITMAP;
				for (var i = Log.Index + 1; i < Log.Count; i++) {
					var FolderItem = Log.Item(i);
					AddMenuIconFolderItem(mii, FolderItem);
					mii.dwTypeData = api.GetDisplayNameOf(FolderItem, SHGDN_INFOLDER | SHGDN_ORIGINAL);
					mii.wID = i;
					api.InsertMenuItem(hMenu, MAXINT, false, mii);
				}
				var pt = api.Memory("POINT");
				api.GetCursorPos(pt);
				var nVerb = api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null, null);
				api.DestroyMenu(hMenu);
				if (nVerb) {
					if (FV.Data.Lock || api.GetKeyState(VK_MBUTTON) < 0 || api.GetKeyState(VK_CONTROL) < 0) {
						FV.Navigate(Log[nVerb], SBSP_NEWBROWSER);
					} else {
						Log.Index = nVerb;
						FV.History = Log;
					}
				}
			}
			return false;
		},

		ChangeView: function (Ctrl) {
			var TC = Ctrl.Parent;
			var o = document.getElementById("ImgBack_" + TC.Id);
			if (o) {
				if (TC && Ctrl.Id == TC.Selected.Id) {
					var Log = Ctrl.History;
					DisableImage(o, Log && Log.Index >= Log.Count - 1);
				}
			} else {
				(function (Ctrl) {
					setTimeout(function () {
						Addons.InnerBack.ChangeView(Ctrl);
					}, 999);
				})(Ctrl);
			}
		}
	};

	AddEvent("PanelCreated", function (Ctrl) {
		var h = GetIconSize(GetAddonOption("innerback", "IconSize"), 16);
		var src = GetAddonOption("innerback", "Icon") || (h <= 16 ? "bitmap:ieframe.dll,206,16,0" : "bitmap:ieframe.dll,214,24,0");
		var s = ['<span class="button" onclick="return Addons.InnerBack.Click($)" oncontextmenu="return Addons.InnerBack.Popup(this, $)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', GetImgTag({ id: "ImgBack_$", title: "Back", src: src }, h), '</span>'];
		SetAddon(null, "Inner1Left_" + Ctrl.Id, s.join("").replace(/\$/g, Ctrl.Id));
	});

	AddEvent("ChangeView", Addons.InnerBack.ChangeView);
}
