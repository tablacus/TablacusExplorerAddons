var Addon_Id = "drivebutton";
var Default = "ToolBar2Left";

if (window.Addon == 1) {
	Addons.DriveButton =
	{
		Exec: function (o)
		{
			if (window.event && window.event.button == 2) {
				return true;
			}
			var FV = GetFolderView(o);
			if (FV) {
				FV.Focus();
			}
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
				var nVerb = api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, screenLeft + pt.x, screenTop + pt.y + o.offsetHeight * screen.deviceYDPI / screen.logicalYDPI, te.hwnd, null);
				api.DestroyMenu(hMenu);
				if (nVerb) {
					FolderMenu.Invoke(FolderMenu.Items[nVerb - 1]);
				}
				FolderMenu.Clear();
			}, 99);}) (o);
			return false;
		}
	};

	var h = GetAddonOption(Addon_Id, "IconSize") || window.IconSize || (GetAddonLocation(Addon_Id) == "Inner" ? 16 : 24);
	var src = GetAddonOption(Addon_Id, "Icon") || (h <= 16 ? "icon:shell32.dll,8,16" : "icon:shell32.dll,8,32");
	h = h > 0 ? h + 'px' : EncodeSC(h);
	SetAddon(Addon_Id, Default, ['<span class="button" onmousedown="return Addons.DriveButton.Exec(this)" oncontextmenu="PopupContextMenu(ssfDRIVES)" onmouseover="MouseOver(this)" onmouseout="MouseOut()"><img title="Drive" src="', EncodeSC(src), '" width="', h, '" height="', h, '"></span>']);
} else {
	EnableInner();
}
