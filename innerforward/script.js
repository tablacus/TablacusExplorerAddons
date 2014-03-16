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
				for (var i = Log.Index; i-- > 0;) {
					var FolderItem = Log.Item(i);
					mii.dwTypeData = api.GetDisplayNameOf(FolderItem, SHGDN_INFOLDER);
					mii.wID = i + 1;
					AddMenuIconFolderItem(mii, FolderItem);
					api.InsertMenuItem(hMenu, MAXINT, false, mii);
				}
				var pt = api.Memory("POINT");
				api.GetCursorPos(pt);
				var nVerb = api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null, null);
				api.DestroyMenu(hMenu);
				if (nVerb) {
					Log.Index = nVerb - 1;
					FV.History = Log;
				}
			}
		},
		
		ChangeView: function (Ctrl)
		{
			var TC = Ctrl.Parent;
			var o = document.getElementById("ImgForward_" + TC.Id);
			if (o) {
				if (TC && Ctrl.Id == TC.Selected.Id) {
					var Log = Ctrl.History;
					DisableImage(o, Log && Log.Index == 0);
				}
			}
			else {
				(function (Ctrl) { setTimeout(function () {
					Addons.InnerForward.ChangeView(Ctrl);
				}, 1000);}) (Ctrl);
			}
		}
	};

	AddEvent("PanelCreated", function (Ctrl)
	{
		var h = GetAddonOption("innerforward", "IconSize") || 16;
		var src = GetAddonOption("innerforward", "Icon") || (h <= 16 ? "bitmap:ieframe.dll,206,16,1" : "bitmap:ieframe.dll,214,24,1");
		var s = ['<span class="button" onclick="return Addons.InnerForward.Click($)" oncontextmenu="Addons.InnerForward.Popup(this, $); return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()"><img id="ImgForward_$" title="Forward" src="', src.replace(/"/g, ""), '" width="', h, 'px" height="', h, 'px"></span>'];
		SetAddon(null, "Inner1Left_" + Ctrl.Id, s.join("").replace(/\$/g, Ctrl.Id));
	});

	AddEvent("ChangeView", Addons.InnerForward.ChangeView);
}
