var Addon_Id = "drivebutton";
var Default = "ToolBar2Left";

if (window.Addon == 1) {
	g_drivebutton =
	{
		Open: function (o)
		{
			(function (o) { setTimeout(function () {
				MouseOver(o);
				var hMenu = api.CreatePopupMenu();
				var Items = sha.NameSpace(ssfDRIVES).Items();
				var mii = api.Memory("MENUITEMINFO");
				mii.cbSize = mii.Size;
				mii.fMask  = MIIM_ID | MIIM_STRING | MIIM_BITMAP;
				FolderMenu.Clear();
				for (var i = 0; i < Items.Count; i++) {
					var path = api.GetDisplayNameOf(Items.Item(i), SHGDN_FORPARSING);
					if (path.length <= 3) {
						FolderMenu.AddMenuItem(hMenu, Items.Item(i));
					}
				}
				var pt = GetPos(o);
				window.g_menu_click = true;
				var nVerb = api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, screenLeft + pt.x, screenTop + pt.y + o.offsetHeight, external.hwnd, null);
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
			}, 100);}) (o);
			return false;
		}
	};

	var sml = 'l';
	var size = 24;
	if (IconSize && IconSize <= 16) {
		sml = 's';
		size = 16;
	}
	else if (IconSize >= 32) {
		size = 32;
	}
	var alt = 'Drive';
	var png = '_3_8';
	var icon = 'icon="shell32.dll,8,';
	var cmd = 'onmousedown="return g_drivebutton.Open(this)"';
	SetAddon(Addon_Id, Default, '<span class="button" id="' + Addon_Id + '" ' + cmd + ' onmouseover="MouseOver(this)" onmouseout="MouseOut()"><img alt="' + alt + '" width=' + size + ' src="../image/toolbar/' + sml + png + '.png" ' + icon + size + '"></span> ');
}
