if (window.Addon == 1) {
	Addons.InnerBack =
	{
		Click: function (Id)
		{
			var FV = GetInnerFV(Id);
			if (FV) {
				FV.Navigate(null, SBSP_NAVIGATEBACK | SBSP_SAMEBROWSER);
			}
			return false;
		},

		Popup: function (o, id)
		{
			var FV = GetInnerFV(id);
			if (FV) {
				var Log = FV.History;
				var hMenu = api.CreatePopupMenu();
				FolderMenu.Clear();
				for (var i = Log.Index + 1; i < Log.Count; i++) {
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
		var h = GetAddonOption("innerback", "IconSize") || 16;
		var s = GetAddonOption("innerback", "Icon") || (h <= 16 ? "bitmap:ieframe.dll,206,16,0" : "bitmap:ieframe.dll,214,24,0");
		s = 'src="' + s.replace(/"/g, "") + '" width="' + h + 'px" height="' + h + 'px"';
		s = '<span class="button" onclick="return Addons.InnerBack.Click($)" oncontextmenu="Addons.InnerBack.Popup(this, $); return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()"><img id="ImgBack_$" title="Back" ' + s + '></span>';
		SetAddon(null, "Inner1Left_" + Ctrl.Id, s.replace(/\$/g, Ctrl.Id));
	});

	AddEvent("ChangeView", function (Ctrl)
	{
		var Log = Ctrl.History;
		var TC = Ctrl.Parent;
		if (TC) {
			DisableImage(document.getElementById("ImgBack_" + TC.Id), Log && Log.Index >= Log.Count - 1);
		}
	});
}

