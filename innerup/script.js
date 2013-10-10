if (window.Addon == 1) {
	Addons.InnerUp =
	{
		Exec: function (Id)
		{
			var FV = GetInnerFV(Id);
			if (FV) {
				FV.Navigate(null, SBSP_PARENT | SBSP_SAMEBROWSER);
			}
			return false;
		},

		Popup: function (o, id)
		{
			var FV = GetInnerFV(id);
			if (FV) {
				FolderMenu.Clear();
				var hMenu = api.CreatePopupMenu();
				var FolderItem = FV.FolderItem;
				while (!api.ILIsEmpty(FolderItem)) {
					FolderItem = api.ILRemoveLastID(FolderItem);
					FolderMenu.AddMenuItem(hMenu, FolderItem);
				}
				var pt = api.Memory("POINT");
				api.GetCursorPos(pt);
				window.g_menu_click = true;
				var nVerb = api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, external.hwnd, null, null);
				api.DestroyMenu(hMenu);
				var FolderItem;
				if (nVerb) {
					FolderItem = FolderMenu.Items[nVerb - 1];
				}
				FolderMenu.Clear();
				if (nVerb) {
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
			}
		}
	};

	AddEvent("PanelCreated", function (Ctrl)
	{
		var h = GetAddonOption("innerup", "IconSize") || 16;
		var s = GetAddonOption("innerup", "Icon") || (h <= 16 ? "bitmap:ieframe.dll,216,16,28" : "bitmap:ieframe.dll,214,24,28");
		s = 'src="' + s.replace(/"/g, "") + '" width="' + h + 'px" height="' + h + 'px"';
		s = '<span class="button" onclick="return Addons.InnerUp.Exec($)" oncontextmenu="Addons.InnerUp.Popup(this, $); return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()"><img title="Up" ' + s + '></span>';
		SetAddon(null, "Inner1Left_" + Ctrl.Id, s.replace(/\$/g, Ctrl.Id));
	});
}
