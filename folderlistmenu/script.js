if (window.Addon == 1) {
	AddType("Folder list menu",
	{
		Exec: function (Ctrl, s, type, hwnd, pt)
		{
			var FV = GetFolderView(Ctrl, pt);
			if (FV) {
				FV.Focus();
			}
			var oMenu = {'\\' : api.CreatePopupMenu()};
			var strMenu = [];
			var items = [];
			s = api.PathUnquoteSpaces(ExtractMacro(te, s));
			var ado = OpenAdodbFromTextFile(s);
			if (!ado) {
				MessageBox(api.FormatMessage(api.LoadString(hShell32, 8720) || "Not found %1!ls!", s));
				return;
			}
			var Parent = fso.GetParentFolderName(s);
			var res, Name = "", Img = "";
			var mii = api.Memory("MENUITEMINFO");
			mii.cbSize = mii.Size;
			mii.fMask = MIIM_ID | MIIM_BITMAP | MIIM_SUBMENU | MIIM_DATA | MIIM_STRING | MIIM_FTYPE;
			MenusIcon(mii, "icon:shell32.dll,3,16");
			var hbmFolder = mii.hbmpItem;
			var lines = ado.ReadText(adReadAll).split(/[\r?\n]/);
			ado.Close();
			for (var i in lines) {
				var path = ExtractMacro(te, lines[i]).replace(/^\s*|\s$/, "");
				if (!path) {
					continue;
				}
				if (/^#/.test(path)) {
					res = /^#EXTINF:[\d\s\-]+,\s*(.*)/i.exec(path);
					if (res) {
						Name = res[1];
					}
					res = /^#EXTIMG:\s*(.*)/i.exec(path);
					if (res) {
						Img = res[1];
					}
					continue;
				}
				if (!Name) {
					res = /^(.*?)\s*\t([^\s].*)$/.exec(path) || /^(.*?)\s*(["`].*)$/i.exec(path) || /^(.*?)\s{4,}([^\s].*)$/.exec(path) || /^(.*?)\s*("?[a-z]+:.*)$/i.exec(path) || /^(.*?)\s*(\\\\.*)$/.exec(path) || /^(.*?)\s*(::{.*)$/.exec(path);
					if (res) {
						if (res[1]) {
							Name = res[1];
							path = res[2];
						}
					}
				}
				path = path.replace(/^\s*|\s*$/g, "");
				items.push(path);
				var hbm = hbmFolder;
				if (Img) {
					if (Img == "...") {
						Img = path;
					}
					var fn = api.PathUnquoteSpaces(ExtractMacro(te, Img));
					var image = te.WICBitmap();;
					if (!image.FromFile(fn)) {
						var sfi = api.Memory("SHFILEINFO");
						api.SHGetFileInfo(fn, 0, sfi, sfi.Size, SHGFI_ICON | SHGFI_SMALLICON | SHGFI_USEFILEATTRIBUTES);
						image.FromHICON(sfi.hIcon);
						api.DestroyIcon(sfi.hIcon);
					}
					AddMenuImage(mii, image, fn);
					hbm = mii.hbmpItem;
				}
				var arName = (Name || fso.GetFileName(api.PathUnquoteSpaces(path.replace(/`/g, ""))) || path.replace(/\\/g, "")).split(/\\|\/|\|/);
				var strPath = '';
				var hMenu = oMenu['\\'];
				while (arName.length > 1) {
					var s = arName.shift();
					if (s) {
						strPath += '\\' + s;
						if (oMenu[strPath]) {
							hMenu = oMenu[strPath];
						} else {
							mii.dwTypeData = s;
							mii.hSubMenu = api.CreateMenu();
							mii.fType = 0;
							mii.hbmpItem = arName.length > 1 || arName[0] ? hbmFolder : hbm;
							oMenu[strPath] = mii.hSubMenu;
							api.InsertMenuItem(hMenu, MAXINT, false, mii);
							hMenu = mii.hSubMenu;
						}
					}
				}
				Name = arName.pop();
				if (Name) {
					mii.dwTypeData = Name;
					mii.fType = Name == "-" ? MFT_SEPARATOR : 0;
					mii.hbmpItem = hbm;
					mii.hSubMenu = 0;
					mii.wID = items.length;
					api.InsertMenuItem(hMenu, MAXINT, false, mii);
				}
				Name = "";
				Img = "";
			}
			if (!pt) {
				var pt = GetPos(Ctrl, true, false, false, true);
				if (Ctrl.Type) {
					api.GetCursorPos(pt);
				}
			}
			window.g_menu_click = true;
			var nVerb = api.TrackPopupMenuEx(oMenu['\\'], TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null);
			for (var i in oMenu) {
				api.DestroyMenu(oMenu[i]);
			}
			if (nVerb) {
				FolderMenu.Invoke(api.ILCreateFromPath(items[nVerb - 1]), GetAddonOption("folderlistmenu", "NewTab") ? SBSP_NEWBROWSER : undefined);
			}
			return S_OK;
		},

		Ref: OpenDialog
	});
} else {
	SetTabContents(0, "General", '<table style="width: 100%"><tr><td><input type="checkbox" id="NewTab" /><label for="NewTab">New Tab</label></td></tr></table>');
}
