var Addon_Id = "forward";
var Default = "ToolBar2Left";

if (window.Addon == 1) {
	Addons.Forward =
	{
		Popup: function (o)
		{
			var FV = te.Ctrl(CTRL_FV);
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

	AddEvent("ChangeView", function (Ctrl)
	{
		if (Ctrl.Id == Ctrl.Parent.Selected.Id) {
			var Log = Ctrl.History;
			DisableImage(document.getElementById("ImgForward"), Log && Log.Index == 0);
		}
	});

	var h = GetAddonOption(Addon_Id, "IconSize") || window.IconSize || 24;
	var src = GetAddonOption(Addon_Id, "Icon") || (h <= 16 ? "bitmap:ieframe.dll,206,16,1" : "bitmap:ieframe.dll,214,24,1");
	var s = ['<span class="button" onclick="Navigate(null, SBSP_NAVIGATEFORWARD | SBSP_SAMEBROWSER); return false;" oncontextmenu="Addons.Forward.Popup(this); return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()"><img id="ImgForward" title="Forward" src="', src.replace(/"/g, ""), '" width="', h, 'px" height="', h, 'px"></span>'];
	SetAddon(Addon_Id, Default, s);
}
