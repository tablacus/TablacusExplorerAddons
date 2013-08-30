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
		}

	};

	AddEvent("DeviceChanged", function ()
	{
		var icon = [53, 7, 8, 9, 11, 12];
		var image = te.GdiplusBitmap;
		var strDrive = "";
		var Items = sha.NameSpace(ssfDRIVES).Items();
		for (var i = 0; i < Items.Count; i++) {
			var Item = Items.Item(i);
			var path = Item.Path;
			var letter = path.charAt(0);
			if (path.length == 3 || letter.match(/^[:;]/)) {
				var vol = api.GetDisplayNameOf(Item, SHGDN_INFOLDER);
				var src = '';
				if (document.documentMode) { //IE8-
					var info = api.Memory("SHFILEINFO");
					api.ShGetFileInfo(Item, 0, info, info.Size, SHGFI_ICON | SHGFI_SMALLICON | SHGFI_PIDL);
					var hIcon = info.hIcon;
					if (hIcon) {
						image.FromHICON(hIcon, api.GetSysColor(COLOR_BTNFACE));
						src = image.DataURI("image/png" , hIcon);
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
					src = MakeImgSrc('icon:shell32.dll,' + nIcon + ',16', 0, false, 16);
				}
				strDrive += '<span class="button" title="' + vol + '" path="' + path + '" onclick="Addons.DriveBar.Open(this)" oncontextmenu="Addons.DriveBar.Popup(this); return false" onmouseover="MouseOver(this)" onmouseout="MouseOut()"><span style="position: absolute; font-weight: bold; font-size: 9px; text-shadow: 1px 1px 0px buttonface, -1px 1px 0px buttonface, 1px -1px 0px buttonface, -1px -1px 0px buttonface; filter: glow(color=white,strength=1);">' + letter + '</span><img width=16 height=16 src="' + src + '" /></span>';
			}
		}
		document.getElementById("drivebar").innerHTML = strDrive;
	});

	SetAddon(Addon_Id, Default, '<span id="drivebar"></span>');
}

