AddType("Folder list menu", {
	Exec: function (Ctrl, s, type, hwnd, pt) {
		const FV = GetFolderView(Ctrl, pt);
		if (FV) {
			FV.Focus();
		}
		const oMenu = api.CreateObject("Object");
		oMenu['\\'] = api.CreatePopupMenu();
		const items = api.CreateObject("Array");;
		s = ExtractPath(te, s);
		const ado = OpenAdodbFromTextFile(s);
		if (!ado) {
			MessageBox(api.FormatMessage(api.LoadString(hShell32, 8720) || "Not found %1!ls!", s));
			return;
		}
		let res, Name = "", Img = "";
		const mii = api.Memory("MENUITEMINFO");
		mii.cbSize = mii.Size;
		mii.fMask = MIIM_ID | MIIM_BITMAP | MIIM_SUBMENU | MIIM_DATA | MIIM_STRING | MIIM_FTYPE;
		MenusIcon(mii, "folder:closed");
		const hbmFolder = mii.hbmpItem;
		const lines = ado.ReadText(adReadAll).split(/[\r?\n]/);
		ado.Close();
		let nextType = 0;
		for (let i in lines) {
			let path = ExtractMacro(te, lines[i]).replace(/^\s*|\s$/, "");
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
			let hbm = hbmFolder;
			if (Img) {
				if (Img == "...") {
					Img = path;
				}
				const ar = Img.split(/,/);
				const fn = api.PathUnquoteSpaces(ExtractMacro(te, ar[0]));
				let image = api.CreateObject("WICBitmap");
				if (/\.ico$/i.test(fn) || !image.FromFile(fn)) {
					const sfi = api.Memory("SHFILEINFO");
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
			const arName = (Name || fso.GetFileName(api.PathUnquoteSpaces(path.replace(/`/g, ""))) || path.replace(/\\/g, "")).split(/\\|\/|\|/);
			let strPath = '';
			let hMenu = oMenu['\\'];
			while (arName.length > 1) {
				const s = arName.shift();
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
		InvokeUI("Addons.FolderListMenu.Exec", [oMenu, items, pt]);
		return S_OK;
	},

	Ref: OpenDialog
});
