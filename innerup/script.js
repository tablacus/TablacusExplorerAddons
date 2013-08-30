if (window.Addon == 1) {
	g_innerup =
	{
		Click: function (Id)
		{
			var FV = GetInnerFV(Id);
			if (FV) {
				FV.Navigate(null, SBSP_PARENT | SBSP_SAMEBROWSER);
			}
			return false;
		},

		Popup: function (Id)
		{
			var o = document.getElementById("UpButton_" + Id);
			var FV = GetInnerFV(Id);
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
		var s = '<span class="button" id="UpButton_$" onclick="g_innerup.Click($)" oncontextmenu="g_innerup.Popup($); return false" onmouseover="MouseOver(this)" onmouseout="MouseOut()"><img alt="Up" src="../image/toolbar/s_1_28.png" bitmap="ieframe.dll,216,16,28"></span><span style="width: 0px"> </span>';
		SetAddon(null, "Inner1Left_" + Ctrl.Id, s.replace(/\$/g, Ctrl.Id));
	});
}
