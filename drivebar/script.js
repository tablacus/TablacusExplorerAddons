var Addon_Id = "drivebar";
var Default = "ToolBar1Right";

if (window.Addon == 1) {
	Addons.DriveBar =
	{
		Items: [],

		Open: function (o)
		{
			var path = o.path || o.getAttribute("path");
			Navigate(path, SBSP_NEWBROWSER);
		},

		Popup: function (o)
		{
			var path = o.path || o.getAttribute("path");
			var ContextMenu = api.ContextMenu(path);
			var hMenu = api.CreatePopupMenu();
			if (ContextMenu) {
				ContextMenu.QueryContextMenu(hMenu, 0, 1, 0x7FFF, CMF_NORMAL);
				var pt = api.Memory("POINT");
				api.GetCursorPos(pt);
				var nVerb = api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null, ContextMenu);
				if (nVerb) {
					ContextMenu.InvokeCommand(0, te.hwnd, nVerb - 1, null, null, SW_SHOWNORMAL, 0, 0);
				}
			}
			api.DestroyMenu(hMenu);
		},

		Update: function (Ctrl)
		{
			var h = GetIconSize(0, 16);
			var icon = [53, 7, 8, 9, 11, 12];
			var image = api.CreateObject("WICBitmap");
			var arDrive = [];
			var Items = sha.NameSpace(ssfDRIVES).Items();
			for (var i = 0; i < Items.Count; i++) {
				var Item = Items.Item(i);
				var path = Item.Path;
				var letter = path.charAt(0);
				if (path.length == 3 || (letter.match(/^[:;]/) && !IsUseExplorer(Item))) {
					var vol = api.GetDisplayNameOf(Item, SHGDN_INFOLDER);
					var src = '';
					if (document.documentMode) { //IE8-
						var sfi = api.Memory("SHFILEINFO");
						api.SHGetFileInfo(Item, 0, sfi, sfi.Size, SHGFI_ICON | SHGFI_SMALLICON | SHGFI_PIDL);
						var hIcon = sfi.hIcon;
						if (hIcon) {
							image.FromHICON(hIcon, api.GetSysColor(COLOR_BTNFACE));
							src = image.DataURI("image/png", hIcon);
							api.DestroyIcon(hIcon);
						}
					}
					if (!src) {
						var nIcon = icon[0];
						if (letter >= 'A' && letter <= 'Z') {
							try {
								var oDrive = fso.GetDrive(letter);
								nIcon = oDrive ? icon[oDrive.DriveType] : icon[0];
							} catch (e) {
								nIcon = 10;
							}
						}
						src = MakeImgSrc('icon:shell32.dll,' + nIcon, 0, false, h);
					}
					arDrive.push('<span class="button" title="', vol, '" path="', path, '" onclick="Addons.DriveBar.Open(this)" oncontextmenu="Addons.DriveBar.Popup(this); return false" onmouseover="MouseOver(this)" onmouseout="MouseOut()"><span class="drive">', letter, '</span>', GetImgTag({ src: src }, h), '</span>');
				}
			}
			document.getElementById("drivebar").innerHTML = arDrive.join("");
		}	
	};

	AddEvent("Load", Addons.DriveBar.Update);

	AddEvent("DeviceChanged", Addons.DriveBar.Update);

	AddEvent("ChangeNotify", function (Ctrl, pidls, wParam, lParam)
	{
		if (pidls.lEvent & (SHCNE_MEDIAINSERTED | SHCNE_MEDIAREMOVED | SHCNE_DRIVEREMOVED | SHCNE_DRIVEADD | SHCNE_NETSHARE | SHCNE_NETUNSHARE)) {
			Addons.DriveBar.Update();
		}
	});

	SetAddon(Addon_Id, Default, '<span id="drivebar"></span>');
}
