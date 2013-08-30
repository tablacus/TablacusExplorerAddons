if (window.Addon == 1) {
	Addons.InnerForward =
	{
		Click: function (Id)
		{
			var FV = GetInnerFV(Id);
			if (FV) {
				FV.Navigate(null, SBSP_NAVIGATEFORWARD | SBSP_SAMEBROWSER);
			}
			return false;
		},

		Popup: function (o, Id)
		{
			var FV = GetInnerFV(Id);
			if (FV) {
				var Log = FV.History;
				var hMenu = api.CreatePopupMenu();
				var mii = api.Memory("MENUITEMINFO");
				mii.cbSize = mii.Size;
				mii.fMask  = MIIM_ID | MIIM_STRING | MIIM_BITMAP;
				var arBM = [];
				for (var i = Log.Index - 1; i >= 0; i--) {
					var FolderItem = Log.Item(i);
					mii.dwTypeData = ' ' + api.GetDisplayNameOf(FolderItem, SHGDN_INFOLDER);
					var image = te.GdiplusBitmap;
					var info = api.Memory("SHFILEINFO");
					api.ShGetFileInfo(FolderItem, 0, info, info.Size, SHGFI_ICON | SHGFI_SMALLICON | SHGFI_PIDL);
					var hIcon = info.hIcon;
					var cl = api.GetSysColor(COLOR_MENU);
					image.FromHICON(hIcon, cl);
					api.DestroyIcon(hIcon);
					mii.hbmpItem = image.GetHBITMAP(cl);
					arBM.push(mii.hbmpItem);
					mii.wID = i + 1;
					api.InsertMenuItem(hMenu, MAXINT, false, mii);
				}
				var pt = api.Memory("POINT");
				api.GetCursorPos(pt);
				var nVerb = api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null, null);
				api.DestroyMenu(hMenu);
				while (arBM.length) {
					api.DeleteObject(arBM.pop());
				}
				if (nVerb) {
					Log.Index = nVerb - 1;
					FV.History = Log;
				}
			}
		}
	};

	AddEvent("PanelCreated", function (Ctrl)
	{
		var h = GetAddonOption("innerforward", "IconSize") || 16;
		var s = GetAddonOption("innerforward", "Icon") || (h <= 16 ? "bitmap:ieframe.dll,206,16,1" : "bitmap:ieframe.dll,214,24,1");
		s = 'src="' + s.replace(/"/g, "") + '" width="' + h + 'px" height="' + h + 'px"';
		var s = '<span class="button" onclick="return Addons.InnerForward.Click($)" oncontextmenu="Addons.InnerForward.Popup(this, $); return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()"><img id="ImgForward_$" title="Forward" ' + s + '></span>';
		SetAddon(null, "Inner1Left_" + Ctrl.Id, s.replace(/\$/g, Ctrl.Id));
	});

	AddEvent("ChangeView", function (Ctrl)
	{
		var Log = Ctrl.History;
		var TC = Ctrl.Parent;
		if (TC) {
			DisableImage(document.getElementById("ImgForward_" + TC.Id), Log && Log.Index == 0);
		}
	});
}
