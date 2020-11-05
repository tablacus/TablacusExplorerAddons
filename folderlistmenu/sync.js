AddType("Folder list menu", {
	Exec: function (Ctrl, s, type, hwnd, pt) {
		var FV = GetFolderView(Ctrl, pt);
		if (FV) {
			FV.Focus();
		}
		var oMenu = api.CreateObject("Object");
		oMenu['\\'] = api.CreatePopupMenu();
		var items = api.CreateObject("Array");;
		s = api.PathUnquoteSpaces(ExtractMacro(te, s));
		var ado = OpenAdodbFromTextFile(s);
		if (!ado) {
			MessageBox(api.FormatMessage(api.LoadString(hShell32, 8720) || "Not found %1!ls!", s));
			return;
		}
		var res, Name = "", Img = "";
		var mii = api.Memory("MENUITEMINFO");
		mii.cbSize = mii.Size;
		mii.fMask = MIIM_ID | MIIM_BITMAP | MIIM_SUBMENU | MIIM_DATA | MIIM_STRING | MIIM_FTYPE;
		MenusIcon(mii, "folder:closed");
		var hbmFolder = mii.hbmpItem;
		var lines = ado.ReadText(adReadAll).split(/[\r?\n]/);
		ado.Close();
		var nextType = 0;
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
				var ar = Img.split(/,/);
				var fn = api.PathUnquoteSpaces(ExtractMacro(te, ar[0]));
				var image = api.CreateObject("WICBitmap");
				if (/\.ico$/i.test(fn) || !image.FromFile(fn)) {
					var sfi = api.Memory("SHFILEINFO");
					api.SHGetFileInfo(fn, 0, sfi, sfi.Size, SHGFI_ICON | SHGFI_SMALLICON | SHGFI_USEFILEATTRIBUTES);
					image.FromHICON(sfi.hIcon);
					api.DestroyIcon(sfi.hIcon);
				}
				if (ar[1] > 0) {
					image = GetThumbnail(image, ar[1], false);
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
				mii.fType = Name == "-" ? MFT_SEPARATOR : nextType;
				nextType = 0;
				mii.hbmpItem = hbm;
				mii.hSubMenu = 0;
				mii.wID = items.length;
				api.InsertMenuItem(hMenu, MAXINT, false, mii);
			}
			if (path == "/") {
				nextType = MFT_MENUBREAK;
			} else if (path == "//") {
				nextType = MFT_MENUBARBREAK;
			}
			Name = "";
			Img = "";
		}
		api.Invoke(UI.Addons.FolderListMenu, oMenu, items, pt);
		return S_OK;
	},

	Ref: OpenDialog
});
