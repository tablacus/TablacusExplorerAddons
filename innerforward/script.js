if (window.Addon == 1) {
	Addons.InnerForward =
	{
		Click: function (Id) {
			var FV = GetInnerFV(Id);
			if (FV) {
				FV.Focus();
				Exec(FV, "Forward", "Tabs");
			}
			return false;
		},

		Popup: function (o, Id) {
			var FV = GetInnerFV(Id);
			if (FV) {
				FV.Focus();
				var Log = FV.History;
				var hMenu = api.CreatePopupMenu();
				var mii = api.Memory("MENUITEMINFO");
				mii.cbSize = mii.Size;
				mii.fMask = MIIM_ID | MIIM_STRING | MIIM_BITMAP;
				var arBM = [];
				for (var i = Log.Index; i-- > 0;) {
					var FolderItem = Log.Item(i);
					AddMenuIconFolderItem(mii, FolderItem);
					mii.dwTypeData = api.GetDisplayNameOf(FolderItem, SHGDN_INFOLDER | SHGDN_ORIGINAL);
					mii.wID = i + 1;
					api.InsertMenuItem(hMenu, MAXINT, false, mii);
				}
				var pt = api.Memory("POINT");
				api.GetCursorPos(pt);
				var nVerb = api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null, null);
				api.DestroyMenu(hMenu);
				if (nVerb) {
					if (FV.Data.Lock || api.GetKeyState(VK_MBUTTON) < 0 || api.GetKeyState(VK_CONTROL) < 0) {
						FV.Navigate(Log[nVerb - 1], SBSP_NEWBROWSER);
					} else {
						Log.Index = nVerb - 1;
						FV.History = Log;
					}
				}
			}
			return false;
		},

		ChangeView: function (Ctrl) {
			var TC = Ctrl.Parent;
			var o = document.getElementById("ImgForward_" + TC.Id);
			if (o) {
				if (TC && Ctrl.Id == TC.Selected.Id) {
					var Log = Ctrl.History;
					DisableImage(o, Log && Log.Index < 1);
				}
			} else {
				(function (Ctrl) {
					setTimeout(function () {
						Addons.InnerForward.ChangeView(Ctrl);
					}, 999);
				})(Ctrl);
			}
		}
	};

	AddEvent("PanelCreated", function (Ctrl) {
		var h = GetIconSize(GetAddonOption("innerforward", "IconSize"), 16);
		var src = GetAddonOption("innerforward", "Icon") || (h <= 16 ? "bitmap:ieframe.dll,206,16,1" : "bitmap:ieframe.dll,214,24,1");
		var s = ['<span class="button" onclick="return Addons.InnerForward.Click($)" oncontextmenu="return Addons.InnerForward.Popup(this, $)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', , GetImgTag({ id: "ImgForward_$", title: "Forward", src: src }, h), '</span>'];
		SetAddon(null, "Inner1Left_" + Ctrl.Id, s.join("").replace(/\$/g, Ctrl.Id));
	});

	AddEvent("ChangeView", Addons.InnerForward.ChangeView);
}
