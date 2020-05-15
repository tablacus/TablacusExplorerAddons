var Addon_Id = "drivebutton";
var Default = "ToolBar2Left";

if (window.Addon == 1) {
	var item = GetAddonElement(Addon_Id);

	Addons.DriveButton =
	{
		strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
		nPos: api.LowPart(item.getAttribute("MenuPos")),

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
					var Item = Items.Item(i);
					if (api.PathIsRoot(api.GetDisplayNameOf(Item, SHGDN_FORPARSING))) {
						FolderMenu.AddMenuItem(hMenu, Item);
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
				var nVerb = FolderMenu.TrackPopupMenu(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD,  pt.x, pt.y);
				if (nVerb) {
					FolderMenu.Invoke(FolderMenu.Items[nVerb - 1]);
				}
				FolderMenu.Clear();
			}, 99);
			return S_OK;
		}
	};

	//Menu
	if (item.getAttribute("MenuExec")) {
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

	var h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	var src = item.getAttribute("Icon") || (h <= 16 ? "icon:shell32.dll,8,16" : "icon:shell32.dll,8,32");
	SetAddon(Addon_Id, Default, ['<span class="button" onmousedown="return Addons.DriveButton.Exec(this)" oncontextmenu="PopupContextMenu(ssfDRIVES)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', GetImgTag({ title: "Drive", src: src }, h), '</span>']);
} else {
	EnableInner();
}
