if (window.Addon == 1) {
	Addons.InnerBack =
	{
		Click: function (Id)
		{
			var FV = GetInnerFV(Id);
			if (FV) {
				FV.Focus();
				FV.Navigate(null, SBSP_NAVIGATEBACK | SBSP_SAMEBROWSER);
			}
			return false;
		},

		Popup: function (o, id)
		{
			var FV = GetInnerFV(id);
			if (FV) {
				FV.Focus();
				var Log = FV.History;
				var hMenu = api.CreatePopupMenu();
				var mii = api.Memory("MENUITEMINFO");
				mii.cbSize = mii.Size;
				mii.fMask  = MIIM_ID | MIIM_STRING | MIIM_BITMAP;
				var arBM = [];
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
					Log.Index = nVerb;
					FV.History = Log;
				}
			}
			return false;
		},

		ChangeView: function (Ctrl)
		{
			var TC = Ctrl.Parent;
			var o = document.getElementById("ImgBack_" + TC.Id);
			if (o) {
				if (TC && Ctrl.Id == TC.Selected.Id) {
					var Log = Ctrl.History;
					DisableImage(o, Log && Log.Index >= Log.Count - 1);
				}
			}
			else {
				(function (Ctrl) { setTimeout(function () {
					Addons.InnerBack.ChangeView(Ctrl);
				}, 1000);}) (Ctrl);
			}
		}
	};

	AddEvent("PanelCreated", function (Ctrl)
	{
		var h = GetAddonOption("innerback", "IconSize") || 16;
		var src = GetAddonOption("innerback", "Icon") || (h <= 16 ? "bitmap:ieframe.dll,206,16,0" : "bitmap:ieframe.dll,214,24,0");
		var s = ['<span class="button" onclick="return Addons.InnerBack.Click($)" oncontextmenu="Addons.InnerBack.Popup(this, $); return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()"><img id="ImgBack_$" title="Back" src="', src.replace(/"/g, ""), '" width="', h, 'px" height="', h, 'px"></span>'];
		SetAddon(null, "Inner1Left_" + Ctrl.Id, s.join("").replace(/\$/g, Ctrl.Id));
	});

	AddEvent("ChangeView", Addons.InnerBack.ChangeView);
}
