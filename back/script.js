var Addon_Id = "back";
var Default = "ToolBar2Left";

if (window.Addon == 1) { (function () {
	Addons.Back =
	{
		Popup: function (o)
		{
			var FV = te.Ctrl(CTRL_FV);
			if (FV) {
				var Log = FV.History;
				var hMenu = api.CreatePopupMenu();
				var mii = api.Memory("MENUITEMINFO");
				mii.cbSize = mii.Size;
				mii.fMask  = MIIM_ID | MIIM_STRING | MIIM_BITMAP;
				var arBM = [];
				for (var i = Log.Index + 1; i < Log.Count; i++) {
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
					mii.wID = i;
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
					Log.Index = nVerb;
					FV.History = Log;
				}
			}
			return false;
		}
	};

	AddEvent("ChangeView", function (Ctrl)
	{
		var Log = Ctrl.History;
		DisableImage(document.getElementById("ImgBack"), Log && Log.Index >= Log.Count - 1);
	});
	var h = GetAddonOption(Addon_Id, "IconSize") || window.IconSize || 24;
	var s = GetAddonOption(Addon_Id, "Icon") || (h <= 16 ? "bitmap:ieframe.dll,206,16,0" : "bitmap:ieframe.dll,214,24,0");
	s = 'src="' + s.replace(/"/g, "") + '" width="' + h + 'px" height="' + h + 'px"';
	s = '<span class="button" onclick="Navigate(null, SBSP_NAVIGATEBACK | SBSP_SAMEBROWSER); return false;" oncontextmenu="Addons.Back.Popup(this); return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()"><img id="ImgBack" title="Back" ' + s + '></span>';
	SetAddon(Addon_Id, Default, s);
})();}
