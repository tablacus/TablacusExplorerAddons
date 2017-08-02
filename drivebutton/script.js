var Addon_Id = "drivebutton";
var Default = "ToolBar2Left";

var item = GetAddonElement(Addon_Id);

if (window.Addon == 1) {
	Addons.DriveButton =
	{
		Exec: function (Ctrl, pt)
		{
			var o;
			if (window.event && window.event.button == 2) {
				return true;
			}
			var FV = GetFolderView(Ctrl, pt);
			if (FV) {
				FV.Focus();
			}
			setTimeout(function () {
				if (Ctrl.className) {
					o = Ctrl;
					MouseOver(o);
				}
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
				if (!pt) {
					if (o) {
						pt = GetPos(o);
						pt.x += screenLeft;
						pt.y += screenTop + o.offsetHeight * screen.deviceYDPI / screen.logicalYDPI;
					} else {
						pt = api.Memory("POINT");
						api.GetCursorPos(pt);
					}
				}
				window.g_menu_click = true;
				var nVerb = api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD,  pt.x, pt.y, te.hwnd, null);
				api.DestroyMenu(hMenu);
				if (nVerb) {
					FolderMenu.Invoke(FolderMenu.Items[nVerb - 1]);
				}
				FolderMenu.Clear();
			}, 99);
			return S_OK;
		}
	};

	Addons.DriveButton.strName = item.getAttribute("MenuName");
	if (!Addons.DriveButton.strName) {
		var info = GetAddonInfo(Addon_Id);
		Addons.DriveButton.strName = info.Name;
	}
	//Menu
	if (item.getAttribute("MenuExec")) {
		Addons.DriveButton.nPos = api.LowPart(item.getAttribute("MenuPos"));
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
		{
			api.InsertMenu(hMenu, Addons.DriveButton.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Addons.DriveButton.strName));
			ExtraMenuCommand[nPos] = Addons.DriveButton.Exec;
			return nPos;
		});
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.DriveButton.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.DriveButton.Exec, "Func");
	}

	AddTypeEx("Add-ons", "Drive button", Addons.DriveButton.Exec);

	var h = GetAddonOption(Addon_Id, "IconSize") || window.IconSize || (GetAddonLocation(Addon_Id) == "Inner" ? 16 : 24);
	var src = GetAddonOption(Addon_Id, "Icon") || (h <= 16 ? "icon:shell32.dll,8,16" : "icon:shell32.dll,8,32");
	h = h > 0 ? h + 'px' : EncodeSC(h);
	SetAddon(Addon_Id, Default, ['<span class="button" onmousedown="return Addons.DriveButton.Exec(this)" oncontextmenu="PopupContextMenu(ssfDRIVES)" onmouseover="MouseOver(this)" onmouseout="MouseOut()"><img title="Drive" src="', EncodeSC(src), '" width="', h, '" height="', h, '"></span>']);
} else {
	EnableInner();
}
