if (window.Addon == 1) {
	AddType("NETSCAPE Bookmarks",
	{
		Exec: function (Ctrl, s, type, hwnd, pt)
		{
			var res, Name, path, tag;
			var FV = GetFolderView(Ctrl, pt);
			if (FV) {
				FV.Focus();
			}
			var arMenu = [ api.CreatePopupMenu() ];
			var items = [];
			s = api.PathUnquoteSpaces(ExtractMacro(te, s));
			var ado = OpenAdodbFromTextFile(s);
			if (!ado) {
				MessageBox(api.FormatMessage(api.LoadString(hShell32, 8720) || "Not found %1!ls!", s));
				return;
			}
			var mii = api.Memory("MENUITEMINFO");
			mii.cbSize = mii.Size;
			mii.fMask = MIIM_ID | MIIM_BITMAP | MIIM_SUBMENU | MIIM_DATA | MIIM_STRING | MIIM_FTYPE;
			MenusIcon(mii, "icon:shell32.dll,3,16");
			var hbmFolder = mii.hbmpItem;
			var lines = ado.ReadText(adReadAll).split(/<DT>/i);
			ado.Close();
			for (var i = 1; i < lines.length; i++) {
				var line = lines[i];
				var hMenu = arMenu[arMenu.length - 1];
				if (res = /<A.*?HREF="(.*?)"(.*?)>(.*?)<\/A>/i.exec(line)) {
					tag = res[2];
					path = api.PathCreateFromUrl(res[1]) || res[1];
					Name = res[3];
					items.push(path);
					var hbm = hbmFolder;
					res = /ICON="(.*?)"/.exec(tag);
					if (res) {
						var image = api.CreateObject("WICBitmap").FromFile(res[1]);
						AddMenuImage(mii, image, res[1]);
						hbm = mii.hbmpItem;
					}
					mii.dwTypeData = Name;
					mii.fType = Name == "-" ? MFT_SEPARATOR : 0;
					mii.hbmpItem = hbm;
					mii.hSubMenu = 0;
					mii.wID = items.length;
					api.InsertMenuItem(hMenu, MAXINT, false, mii);
				} else if (/<DL>/i.test(line)) {
					Name = line.replace(/<.*?>|\r\n/g, "");
					items.push(Name);
					mii.dwTypeData = Name;
					mii.fType = Name == "-" ? MFT_SEPARATOR : 0;
					mii.hbmpItem = hbmFolder;
					mii.hSubMenu = api.CreatePopupMenu();
					mii.wID = items.length;
					api.InsertMenuItem(hMenu, MAXINT, false, mii);
					arMenu.push(mii.hSubMenu);
				}
				if (/<\/DL>/i.test(line)) {
					arMenu.pop();
				}
			}
			if (!pt) {
				var pt = GetPos(Ctrl, true, false, false, true);
				if (Ctrl.Type) {
					api.GetCursorPos(pt);
				}
			}
			window.g_menu_click = true;
			hMenu = arMenu[0];
			if (api.GetMenuItemCount(hMenu) == 1) {
				hMenu = api.GetSubMenu(hMenu, 0) || arMenu[0];
			}
			var nVerb = api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null);
			api.DestroyMenu(arMenu[0]);
			if (nVerb) {
				path = items[nVerb - 1];
				if (/^https?:|^ftp:/.test(path)) {
					wsh.Run(path);
				} else {
					FolderMenu.Invoke(api.ILCreateFromPath(path), GetAddonOption("netscapebookmarks", "NewTab") ? SBSP_NEWBROWSER : undefined);
				}
			}
			return S_OK;
		},

		Ref: OpenDialog
	});
} else {
	SetTabContents(0, "", '<table style="width: 100%"><tr><td><input type="checkbox" id="NewTab" /><label for="NewTab">New Tab</label></td></tr></table>');
}