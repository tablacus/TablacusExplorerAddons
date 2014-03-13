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
				FolderMenu.Clear();
				for (var i = Log.Index; i-- > 0;) {
					FolderMenu.AddMenuItem(hMenu, Log.Item(i));
				}
				var pt = api.Memory("POINT");
				api.GetCursorPos(pt);
				window.g_menu_click = true;
				var nVerb = api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null, null);
				api.DestroyMenu(hMenu);
				if (nVerb) {
					var FolderItem = FolderMenu.Items[nVerb - 1];
					switch (window.g_menu_button - 0) {
						case 2:
							PopupContextMenu(FolderItem);
							break;
						case 3:
							Navigate(FolderItem, SBSP_NEWBROWSER);
							break;
						default:
							Navigate(FolderItem, OpenMode);
							break;
					}
				}
				FolderMenu.Clear();
			}
			return false;
		}
	};

	AddEvent("PanelCreated", function (Ctrl)
	{
		var h = GetAddonOption("innerforward", "IconSize") || 16;
		var src = GetAddonOption("innerforward", "Icon") || (h <= 16 ? "bitmap:ieframe.dll,206,16,1" : "bitmap:ieframe.dll,214,24,1");
		var s = ['<span class="button" onclick="return Addons.InnerForward.Click($)" oncontextmenu="Addons.InnerForward.Popup(this, $); return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()"><img id="ImgForward_$" title="Forward" src="', src.replace(/"/g, ""), '" width="', h, 'px" height="', h, 'px"></span>'];
		SetAddon(null, "Inner1Left_" + Ctrl.Id, s.join("").replace(/\$/g, Ctrl.Id));
	});

	AddEvent("ChangeView", function (Ctrl)
	{
		var Log = Ctrl.History;
		var TC = Ctrl.Parent;
		if (TC && Ctrl.Id == TC.Selected.Id) {
			DisableImage(document.getElementById("ImgForward_" + TC.Id), Log && Log.Index == 0);
		}
	});
}
