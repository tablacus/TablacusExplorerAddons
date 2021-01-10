AddType("NETSCAPE Bookmarks", {
	Exec: function (Ctrl, s, type, hwnd, pt) {
		let res, Name, path, tag;
		const FV = GetFolderView(Ctrl, pt);
		if (FV) {
			FV.Focus();
		}
		const arMenu = [api.CreatePopupMenu()];
		const items = [];
		s = ExtractPath(te, s);
		const ado = OpenAdodbFromTextFile(s);
		if (!ado) {
			MessageBox(api.FormatMessage(api.LoadString(hShell32, 8720) || "Not found %1!ls!", s));
			return;
		}
		const mii = api.Memory("MENUITEMINFO");
		mii.cbSize = mii.Size;
		mii.fMask = MIIM_ID | MIIM_BITMAP | MIIM_SUBMENU | MIIM_DATA | MIIM_STRING | MIIM_FTYPE;
		MenusIcon(mii, "folder:closed");
		const hbmFolder = mii.hbmpItem;
		const lines = ado.ReadText(adReadAll).split(/<DT>/i);
		ado.Close();
		for (let i = 1; i < lines.length; i++) {
			const line = lines[i];
			const hMenu = arMenu[arMenu.length - 1];
			if (res = /<A.*?HREF="(.*?)"(.*?)>(.*?)<\/A>/i.exec(line)) {
				tag = res[2];
				path = res[1];
				if (/^file:/i.test(path)) {
					path = api.PathCreateFromUrl(decodeURI(path)) || path;
				}
				Name = DecodeSC(res[3]).replace(/&/g, "&&");
				items.push(path);
				let hbm = hbmFolder;
				res = /ICON="(.*?)"/.exec(tag);
				if (res) {
					const image = api.CreateObject("WICBitmap").FromFile(res[1]);
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
				Name = DecodeSC(line).replace(/&/g, "&&").replace(/<.*?>|\r\n/g, "");
				items.push(Name);
				mii.dwTypeData = Name;
				mii.fType = Name == "-" ? MFT_SEPARATOR : 0;
				mii.hbmpItem = hbmFolder;
				mii.hSubMenu = api.CreatePopupMenu();
				mii.wID = items.length;
				api.InsertMenuItem(hMenu, MAXINT, false, mii);
				arMenu.push(mii.hSubMenu);
			}
			for (let dl = line.split(/<\/DL>/i); dl.length > 1 && arMenu.length > 1; dl.pop()) {
				arMenu.pop();
			}
		}
		if (!pt) {
			if (Ctrl.Type) {
				pt = api.Memory("POINT");
				api.GetCursorPos(pt);
			} else {
				pt = GetPos(Ctrl, 9);
			}
		}
		hMenu = arMenu[0];
		if (api.GetMenuItemCount(hMenu) == 1) {
			hMenu = api.GetSubMenu(hMenu, 0) || arMenu[0];
		}
		const nVerb = api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null);
		api.DestroyMenu(arMenu[0]);
		if (nVerb) {
			path = items[nVerb - 1];
			if (/^https?:|^ftp:/.test(path)) {
				wsh.Run(path);
			} else {
				FolderMenu.Invoke(api.ILCreateFromPath(path), GetAddonOption("netscapebookmarks", "NewTab") ? SBSP_NEWBROWSER : void 0);
			}
		}
		return S_OK;
	},

	Ref: OpenDialog
});
