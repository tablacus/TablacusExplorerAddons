Sync.XFinder = {
	SW: SW_SHOWNORMAL,
	Command: {
		newtab: function (Ctrl, hwnd, pt, line) {
			const p = ExtractMacro(Ctrl, line);
			if (p) {
				Navigate(line, SBSP_NEWBROWSER);
				return S_OK;
			}
			return Exec(Ctrl, "New Tab", "Tabs", hwnd, pt);
		},

		close: function (Ctrl, hwnd, pt, line) {
			const p = ExtractMacro(Ctrl, line);
			if (SameText(p, "Window")) {
				return Exec(Ctrl, "Close Application", "Tools", hwnd, pt);
			}
			if (SameText(p, "Minimize")) {
				api.ShowWindow(te.hwnd, SW_SHOWMINIMIZED);
				return S_OK;
			}
			if (SameText(p, "ToTray")) {
				if (Sync.TaskTray) {
					Sync.TaskTray.CreateIcon(true);
				}
				return S_OK;
			}
			if (/[\\\/\\*\\?]/.test(p)) {
				const FV = GetFolderView(Ctrl, pt);
				if (FV) {
					const TC = FV.Parent;
					for (let i = TC.length; i--;) {
						if (PathMatchEx(api.GetDisplayNameOf(TC[i], SHGDN_FORADDRESSBAR | SHGDN_FORPARSINGEX | SHGDN_FORPARSING) + "", p)) {
							TC[i].Close();
						}
					}
				}
				return S_OK;
			}
			switch (api.LowPart(p) % 10) {
				case 0:
					return Exec(Ctrl, "Close Tab", "Tabs", hwnd, pt);
				case 1:
					return Exec(Ctrl, "Close Other Tabs", "Tabs", hwnd, pt);
				case 2:
					let FV = GetFolderView(Ctrl, pt);
					if (FV) {
						const TC = FV.Parent;
						for (let i = TC.length; i--;) {
							FV = TC[i];
							for (let j = TC.length; j--;) {
								if (i != j && api.ILIsEqual(FV, TC[j])) {
									TC[i].Close();
									break;
								}
							}
						}
					}
					return S_OK;
				case 4:
					FV = GetFolderView(Ctrl, pt);
					if (FV) {
						const TC = FV.Parent;
						for (let i = TC.length; i--;) {
							TC[i].Close();
						}
					}
					return S_OK;
				case 7:
					return Exec(Ctrl, "Close Tabs on Left", "Tabs", hwnd, pt);
				case 9:
					return Exec(Ctrl, "Close Tabs on Right", "Tabs", hwnd, pt);
			}
		},

		closed: function (Ctrl, hwnd, pt, line) {
			if (Common.UndoCloseTab) {
				const FV = GetFolderView(Ctrl, pt);
				if (FV) {
					const hMenu = api.CreatePopupMenu();
					let nCount = Common.UndoCloseTab.db.length;
					if (nCount > 16) {
						nCount = 16;
					}
					for (let i = 0; i < nCount; i++) {
						const mii = api.Memory("MENUITEMINFO");
						mii.cbSize = mii.Size;
						mii.fMask = MIIM_ID | MIIM_STRING | MIIM_BITMAP;
						mii.wId = i + 1;
						let s = Common.UndoCloseTab.db[i];
						if (typeof (s) == "string") {
							s = s.split("\n");
							s = s[s[s.length - 1]];
							if (api.PathIsNetworkPath(s)) {
								MenusIcon(mii, 'icon:dsuiext.dll,25,16');
								s = GetFileName(s) || s;
							} else {
								s = api.ILCreateFromPath(s);
								AddMenuIconFolderItem(mii, s);
								s = api.GetDisplayNameOf(s, SHGDN_INFOLDER);
							}
						} else {
							s = s.Item(s.Index);
							AddMenuIconFolderItem(mii, s);
							s = api.GetDisplayNameOf(s, SHGDN_INFOLDER);
						}
						mii.dwTypeData = String(s);
						api.InsertMenuItem(hMenu, 0, false, mii);
					}
					if (!pt) {
						pt = api.Memory("POINT");
						api.GetCursorPos(pt);
					}
					let s = api.TrackPopupMenuEx(hMenu, TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null);
					if (s) {
						s = Common.UndoCloseTab.db[s - 1];
						if ("string" === typeof s) {
							const a = s.split(/\n/);
							if (a.length > 1) {
								s = te.FolderItems(a.length - 1);
								s.Index = a.pop();
								for (i in a) {
									s.AddItem(a[i]);
								}
							}
						}
						FV.Navigate(s, SBSP_NEWBROWSER);
					}
				}
			}
			return S_OK;
		},

		refresh: function (Ctrl, hwnd, pt, line) {
			return Exec(Ctrl, "Refresh", "Tabs", hwnd, pt);
		},

		rename: function (Ctrl, hwnd, pt, line) {
			const FV = GetFolderView(Ctrl, pt);
			setTimeout(function () {
				if (FV) {
					FV.SelectItem(FV.FocusedItem, SVSI_FOCUSED | SVSI_ENSUREVISIBLE | SVSI_EDIT);
				} else {
					wsh.SendKeys("{F2}");
				}
			}, 99);
			return S_OK;
		},

		go: function (Ctrl, hwnd, pt, line) {
			const p = GetNum(ExtractMacro(Ctrl, line));
			if (p == -1) {
				return Exec(Ctrl, "Back", "Tabs", hwnd, pt);
			}
			if (p == 1) {
				return Exec(Ctrl, "Forward", "Tabs", hwnd, pt);
			}
			return S_OK;
		},

		newfolder: function (Ctrl, hwnd, pt, line) {
			let p = ExtractMacro(Ctrl, line);
			p = /\//.test(p) ? p.replace(/\\\//g, "") : InputDialog(GetText("New Folder"), p);
			if (p) {
				if (!/^[A-Z]:\\|^\\/i.test(p)) {
					const FV = GetFolderView(Ctrl, pt);
					p = BuildPath(FV.FolderItem.Path, p);
				}
				CreateFolder(p);
			}
			return S_OK;
		},

		folder: function (Ctrl, hwnd, pt, line) {
			const p = ExtractMacro(Ctrl, line);
			if (p.length) {
				if (SameText(p, "Find")) {
					sha.FindFiles()
					return S_OK;
				}
				const FV = GetFolderView(Ctrl, pt);
				if (FV) {
					Sync.XFinder.Run(FV, FV, p);
				}
				return S_OK;
			}
			const TV = te.Ctrl(CTRL_TV);
			if (TV) {
				TV.Align = TV.Align ^ 2;
				if (TV.Width == 0 && TV.Align & 2) {
					TV.Width = 200;
				}
			}
			return S_OK;
		},

		newfile: function (Ctrl, hwnd, pt, line) {
			let p = ExtractMacro(Ctrl, line);
			p = /\//.test(p) ? p.replace(/\\\//g, "") : InputDialog(GetText("New File"), p);
			if (p) {
				if (!/^[A-Z]:\\|^\\/i.test(p)) {
					const FV = GetFolderView(Ctrl, pt);
					p = BuildPath(FV.FolderItem.Path, p);
				}
				CreateFile(p);
			}
			return S_OK;
		},

		exec: function (Ctrl, hwnd, pt, line) {
			if (line.length) {
				const FV = GetFolderView(Ctrl, pt);
				if (FV) {
					if (SameText(line, "Undo")) {
						api.SendMessage(FV.hwndView, WM_COMMAND, 28700 - 1, 0);
						return S_OK;
					}
					const Selected = FV.SelectedItems();
					Sync.XFinder.Run(Selected ? Selected : FV, FV, line);
				}
			}
			return S_OK;
		},

		command: function (Ctrl, hwnd, pt, line) {
			return Exec(Ctrl, "Run Dialog", "Tools", hwnd, pt);
		},

		clippath: function (Ctrl, hwnd, pt, line) {
			let Items;
			const FV = GetFolderView(Ctrl, pt);
			if (FV) {
				const p = api.sscanf(line, "%x");
				if (p >= 0x10) {
					Items = FV.SelectedItems();
				} else {
					Items = te.FolderItems();
					Items.AddItem(FV.FocusedItem);
				}
			}
			const a = [];
			if (Items) {
				for (let i = 0; i < Items.Count; i++) {
					let s = Items.Item(i).Path;
					if (p & 1) {
						s = s.replace(/\.[^\\]+$/, "");
					}
					if (p & 2) {
						s = GetFileName(s);
					}
					if (!(p & 8)) {
						s = PathQuoteSpaces(s);
					}
					a.push(s);
				}
			}
			clipboardData.setData("text", a.join("\n"));
			return S_OK;
		},

		preview: function (Ctrl, hwnd, pt, line) {
			return S_OK;
		},

		viewstyle: function (Ctrl, hwnd, pt, line) {
			const FV = GetFolderView(Ctrl, pt);
			if (FV) {
				if (SameText(line, "Menu")) {
					Sync.XFinder.Popup(FV, /&V/i);
					return S_OK;
				}
				let p = api.sscanf(line, "%d");
				if (p < FVM_ICON || p > FVM_THUMBNAIL) {
					p = FV.CurrentViewMode;
					if (p == FVM_ICON && FV.IconSize >= 96) {
						p = FVM_THUMBNAIL;
					}
					if (++p > FVM_THUMBNAIL) {
						p = FVM_ICON;
					}
					if (p == FVM_SMALLICON) {
						p++;
					}
				}
				FV.CurrentViewMode = p;
				if (p == FVM_ICON) {
					FV.IconSize = 48;
				}
				if (p == FVM_THUMBNAIL) {
					FV.IconSize = 96;
				}
			}
			return S_OK;
		},

		sort: function (Ctrl, hwnd, pt, line) {
			const FV = GetFolderView(Ctrl, pt);
			if (FV) {
				const s = ExtractMacro(Ctrl, line);
				if (s) {
					FV.SortColumn = s;
					return S_OK;
				}
				Sync.XFinder.Popup(FV, /&[O|I]/i);
			}
			return S_OK;
		},

		confirm: function (Ctrl, hwnd, pt, line) {
			const ar = WScript.Col(ExtractMacro(Ctrl, line));
			return wsh.Popup(ar[1], 0, ar[0], MB_OKCANCEL | MB_ICONQUESTION | MB_SYSTEMMODAL) != IDCANCEL ? S_OK : E_ABORT;
		},

		columns: function (Ctrl, hwnd, pt, line) {
			const FV = GetFolderView(Ctrl, pt);
			if (FV) {
				FV.Columns = ExtractMacro(FV, line.replace(/^\s+|\s+$/, "")).replace(/,/g, " ");
			}
			return S_OK;
		},

		sendkeys: function (Ctrl, hwnd, pt, line) {
			api.SetFocus(Ctrl.hwnd);
			wsh.SendKeys(ExtractMacro(Ctrl, line.replace(/^\s+|\s+$/, "")));
			return S_OK;
		},

		set: function (Ctrl, hwnd, pt, line) {
			const ar = line.split("=");
			const a = ar.shift().toLowerCase();
			const d = ExtractMacro(Ctrl, ar.join("="));
			const fn = Sync.XFinder.Env[a];
			if (fn) {
				return fn(Ctrl, hwnd, pt, d)
			}
			AddEnv(a, d);
			return S_OK;
		},

		swap: function (Ctrl, hwnd, pt, line) {
			const ar = line.toLowerCase().split(",");
			const a = ExtractMacro(Ctrl, "%" + ar[0] + "%");
			Sync.XFinder.Command.set(Ctrl, hwnd, pt, ar[0] + "=%" + ar[1] + "%");
			Sync.XFinder.Command.set(Ctrl, hwnd, pt, ar[1] + "=" + a);
			return S_OK;
		},

		input: function (Ctrl, hwnd, pt, line) {
			const ar = WScript.Col(ExtractMacro(Ctrl, line));
			const r = InputDialog([ar[1], ar[2]].join("\n"), ar[3] || "");
			if ("string" === typeof r) {
				AddEnv("inputdata", r);
				return S_OK;
			}
			AddEnv("inputdata", "");
			return E_ABORT;
		},

		choosefolder: function (Ctrl, hwnd, pt, line) {
			if (!pt) {
				pt = api.Memory("POINT");
				api.GetCursorPos(pt);
			}
			const ar = WScript.Col(ExtractMacro(Ctrl, line));
			const FolderItem = FolderMenu.Open(ar[0], pt.x, pt.y, ar[1]);
			if (FolderItem) {
				AddEnv("inputdata", api.GetDisplayNameOf(FolderItem, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_FORPARSINGEX));
				return S_OK;
			}
			return S_FALSE;
		},

		lock: function (Ctrl, hwnd, pt, line) {
			const p = ExtractMacro(Ctrl, line);
			const TC = te.Ctrl(CTRL_TC);
			if (TC) {
				if (p.length) {
					const FV = TC[TC.SelectedIndex];
					if (FV) {
						FV.Data.Lock = !api.QuadPart(p);
					}
				}
				Lock(TC, TC.SelectedIndex, true);
			}
			return S_OK;
		},

		foreach: function (Ctrl, hwnd, pt, line) {
			const FV = GetFolderView(Ctrl, pt);
			if (FV) {
				const Selected = FV.SelectedItems();
				if (Selected) {
					for (let i = 0; i < Selected.Count; i++) {
						if (Sync.XFinder.Exec(Ctrl, hwnd, pt, line.replace(/%Variable%/ig, api.GetDisplayNameOf(Selected.Item(i), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING))) != S_OK) {
							break;
						}
					}
				}
			}
		},

		numbering: function (Ctrl, hwnd, pt, line) {
			let FileList, FileIndex, i, strPath, nMode;
			let nStart, nInc, wsSrc, wsDist;
			const DoRename = function (n) {
				try {
					let wsPath, nSame;
					strPath = FileList[n];
					const wsFile = fso.GetBaseName(strPath);
					let wsExt = fso.GetExtensionName(strPath);
					wsExt = wsExt ? "." + wsExt : wsExt;
					const wsParam = ar[0];
					const nD = nStart + FileIndex[n] * nInc;
					const z = wsParam.length + MAX_PATH;
					switch (nMode) {
						case 1:
							wsPath = api.sprintf(z, wsParam, wsFile, wsExt);		// %s%s
							break;
						case 2:
							wsPath = api.sprintf(z, wsParam, wsFile, nD, wsExt); 	// %s%d%s
							break;
						case 3:
							wsPath = api.sprintf(z, wsParam, nD, wsFile, wsExt);	// %d%s%s
							break;
						default:
							wsPath = api.sprintf(z, wsParam, nD) + wsExt; 			// %d
							break;
					}
					wsPath = BuildPath(GetParentFolderName(strPath), wsPath.replace(wsSrc, wsDist));
					if (!SameText(wsPath, FileList[n])) {
						nSame = FileList.indexOf(wsPath);
						if (nSame >= 0) {
							DoRename(nSame);
							if (nSame < n) {
								n--;
							}
						}
						arFrom.push(FileList[n]);
						arTo.push(wsPath);
					}
				} catch (e) { }
				FileList.splice(n, 1);
				FileIndex.splice(n, 1);
			}

			const FV = GetFolderView(Ctrl, pt);
			if (FV) {
				const Selected = FV.Items(SVGIO_SELECTION | SVGIO_FLAG_VIEWORDER);
				const ar = WScript.Col(ExtractMacro(Ctrl, line));
				if (ar.length) {
					if (!/\/|\\/.test(ar[0])) {
						FileList = [];
						FileIndex = [];
						if (!FileList.indexOf) {
							FileList.indexOf = function (s) {
								const n = FileList.length;
								for (let i = 0; i < n; i++) {
									if (s === FileList[i]) {
										return i;
									}
								}
								return -1;
							}
						}
						for (i = 0; i < Selected.length; i++) {
							strPath = Selected.Item(i).Path;
							if (strPath) {
								FileList.unshift(strPath);
								FileIndex.unshift(i);
							}
						}

						nMode = 0;
						for (i = 0; i < ar[0].length; i++) {
							if (ar[0].charAt(i) == '%') {
								while (i < ar[0].length && ar[0].charAt(i) < 'A') {
									i++;
								}
								if (SameText(ar[0].charAt(i), 's')) {
									if (nMode == 0) {
										nMode = 1;
									} else if (nMode == 4) {
										nMode = 3;
									}
								} else if (nMode == 0) {
									nMode = 4;
								} else if (nMode == 1) {
									nMode = 2;
								}
							}
						}
						nStart = api.QuadPart(ar[1]);
						nInc = api.QuadPart(ar[2]) || 1;
						wsSrc = ar[3] || '';
						wsDist = ar[4] || '';
						if (nInc) {
							arFrom = [];
							arTo = [];
							while (FileList.length) {
								DoRename(0);
							}
							if (arFrom.length) {
								api.SHFileOperation(FO_MOVE, arFrom.join("\0"), arTo.join("\0"), FOF_ALLOWUNDO | FOF_MULTIDESTFILES, false);
							}
						}
					}
				}
			}
		},

		"delete": function (Ctrl, hwnd, pt, line) {
			Sync.XFinder.FileOperation(Ctrl, hwnd, FO_DELETE, line);
		},

		copy: function (Ctrl, hwnd, pt, line) {
			Sync.XFinder.FileOperation(Ctrl, hwnd, FO_COPY, line);
		},

		move: function (Ctrl, hwnd, pt, line) {
			Sync.XFinder.FileOperation(Ctrl, hwnd, FO_MOVE, line);
		},

		unlock: function (Ctrl, hwnd, pt, line) {
			const ar = WScript.Col(ExtractMacro(Ctrl, line));
			for (let i in ar) {
				UnlockFV(api.ILCreateFromPath(ar[i]));
			}
			try {
				wsh.CurrentDirectory = te.Data.TempFolder;
			} catch (e) { }
		},

		thumbnail: function (Ctrl, hwnd, pt, line) {
			let hFind;
			const ar = api.CommandLineToArgv(ExtractMacro(Ctrl, line));
			let Size = (WScript.Env("ImageSize") || "96").split(/,/);
			if (Size[1] > Size[0]) {
				Size[0] = Size[1];
			}
			const wfd = api.Memory("WIN32_FIND_DATA");
			if (ar[0].toLowerCase() == "create") {
				for (let i = ar.length; i-- > 1;) {
					hFind = api.FindFirstFile(ar[i], wfd);
					if (hFind != INVALID_HANDLE_VALUE) {
						let image = te.WICBitmap().FromFile(ar[i]);
						if (image) {
							image = GetThumbnail(image, Size[0], true);
							image.Save(ar[i] + ":thumbnail.jpg");
							SetFileTime(ar[i], wfd.ftCreationTime, wfd.ftLastAccessTime, wfd.ftLastWriteTime);
							api.FindClose(hFind);
						}
					}
				}
			} else if (ar[0].toLowerCase() == "delete") {
				for (let i = ar.length; i-- > 1;) {
					hFind = api.FindFirstFile(ar[i], wfd);
					if (hFind != INVALID_HANDLE_VALUE) {
						if (api.DeleteFile(ar[i] + ":thumbnail.jpg")) {
							SetFileTime(ar[i], wfd.ftCreationTime, wfd.ftLastAccessTime, wfd.ftLastWriteTime);
						}
						api.FindClose(hFind);
					}
				}
			} else {
				let image = te.WICBitmap().FromFile(ar[0]);
				if (image) {
					Size = (ar[2] || Size[0]).split(/,/);
					if (Size[1] > Size[0]) {
						Size[0] = Size[1];
					}
					image = GetThumbnail(image, Size[0], true);
					const res = /^(.+):[^\\]+$/.exec(ar[1]);
					if (res) {
						hFind = api.FindFirstFile(res[1], wfd);
					}
					image.Save(ar[1]);
					if (res && hFind != INVALID_HANDLE_VALUE) {
						SetFileTime(res[1], wfd.ftCreationTime, wfd.ftLastAccessTime, wfd.ftLastWriteTime);
						api.FindClose(hFind);
					}
				}
			}
			const FV = GetFolderView(Ctrl, pt);
			te.OnCommand(FV, FV.hwnd, WM_NULL, 0, 0);
		}
	},

	FileOperation: function (Ctrl, hwnd, wFunc, line) {
		let fFlags = 0;
		let bTo = false;
		let bBG = false;
		let bSame = false;
		const pFrom = [];
		const pTo = [];
		const ar = api.CommandLineToArgv(ExtractMacro(Ctrl, line));
		for (let i = 0; i < ar.length; i++) {
			const s = ar[i].toLowerCase();
			if (api.PathMatchSpec(s, '/*')) {
				if (s == '/b') {
					bBG = true;
				}
				if (s == '/e') {
					bSame = true;
				}
				if (s == '/t') {
					bTo = true;
				}
				if (s == '/f') {
					fFlags |= FOF_FILESONLY;
				}
				if (s == '/m') {
					fFlags |= FOF_MULTIDESTFILES;
				}
				if (s == '/r') {
					fFlags |= FOF_RENAMEONCOLLISION;
				}
				if (s == '/s') {
					fFlags |= FOF_SILENT;
				}
				if (s == '/y') {
					fFlags |= FOF_NOCONFIRMATION;
				}
				if (s == '/u' || (s == '/a' && api.GetKeyState(VK_SHIFT) >= 0)) {
					fFlags |= FOF_ALLOWUNDO;
				}
			} else {
				(bTo ? pTo : pFrom).push(PathQuoteSpaces(ar[i]));
			}
		}
		if (pFrom.length && (wFunc == FO_DELETE || pTo.length)) {
			if (bSame && pTo.length == 1) {
				if (api.ILIsEqual(GetParentFolderName(pFrom[0]), slTo[0])) {
					fFlags |= FOF_RENAMEONCOLLISION;
				}
			}
			if (wFunc == FO_DELETE) {
				if (SameText(pFrom[0], 'shell:RecycleBinFolder')) {
					let dwFlags = 0;
					if (fFlags & FOF_SILENT) {
						dwFlags |= SHERB_NOPROGRESSUI;
					}
					if (fFlags & FOF_NOCONFIRMATION) {
						dwFlags |= SHERB_NOCONFIRMATION;
					}
					api.SHEmptyRecycleBin(te.hwnd, pTo.join("\0"), dwFlags);
					return;
				}
				for (let i in pFrom) {
					ChangeNotifyFV(SHCNE_RMDIR, pFrom[i]);
				}
			}
			api.SHFileOperation(wFunc, pFrom.join("\0"), pTo.join("\0"), fFlags, bBG);
		}
	},

	Env: {
		address: function (Ctrl, hwnd, pt, s) {
			SetAddress(s);
			return S_OK;
		},

		clipboard: function (Ctrl, hwnd, pt, s) {
			clipboardData.setData("text", s);
			return S_OK;
		},

		windowposition: function (Ctrl, hwnd, pt, s) {
			const p = s.split(/,/);
			if (pt.length < 4) {
				const rc = api.Memory("RECT");
				api.GetWindowRect(te.hwnd, rc);
				api.MoveWindow(te.hwnd, p[0], p[1], rc.right - rc.left, rc.bottom - rc.top, 1);
			} else {
				api.MoveWindow(te.hwnd, p[0], p[1], p[2], p[3], 1);
			}
			return S_OK;
		},

		windowsize: function (Ctrl, hwnd, pt, s) {
			const rc = api.Memory("RECT");
			api.GetWindowRect(te.hwnd, rc);
			const size = s.split(/,/);
			api.MoveWindow(te.hwnd, rc.left, rc.top, size[0], size[1], 1);
			return S_OK;
		},

		timestamp: function (Ctrl, hwnd, pt, s) {
			const ar = WScript.Col(s);
			for (let i = 1; i < ar.length; i++) {
				api.SetFileTime(ar[i], null, null, ar[0]);
			}
			return S_OK;
		},

		tabname: function (Ctrl, hwnd, pt, s) {
			if (Sync.TabName) {
				const FV = GetFolderView(Ctrl, pt);
				if (FV) {
					Sync.TabName.Set(FV, s)
				}
			}
		},

		tabcolor: function (Ctrl, hwnd, pt, s) {
			if (Sync.TabColor) {
				const FV = GetFolderView(Ctrl, pt);
				if (FV) {
					const ar = WScript.Col(s);
					Sync.TabColor.Set(FV, ar[0])
				}
			}
		},

		sortmode: function (Ctrl, hwnd, pt, s) {
			return Sync.XFinder.Command.sort(Ctrl, hwnd, pt, s);
		},

		viewmode: function (Ctrl, hwnd, pt, s) {
			return Sync.XFinder.Command.viewstyle(Ctrl, hwnd, pt, s);
		},

		columns: function (Ctrl, hwnd, pt, s) {
			return Sync.XFinder.Command.columns(Ctrl, hwnd, pt, s);
		}
	},

	Exec: function (Ctrl, hwnd, pt, line) {
		if (/^\/\//.test(line)) {
			return S_OK;
		}
		let res = /^SW:(\d):(.*)/i.exec(line);
		if (res) {
			this.SW = api.QuadPart(res[1]);
			line = res[2];
		}
		res = /^(\d):(.*)/.exec(line);
		if (res) {
			this.nMode = api.QuadPart(res[1]);
			line = res[2];
		}
		res = /^(.+?):\s*(.*)\s*/.exec(line);
		if (res) {
			const fn = this.Command[res[1].toLowerCase()];
			if (fn) {
				return fn(Ctrl, hwnd, pt, res[2]);
			}
		}
		switch (this.nMode) {
			case 0:
				Navigate(line, OpenMode);
				break;
			case 1:
				ShellExecute(ExtractMacro(Ctrl, line), null, this.SW);
				break;
			case 2:
				ShellExecute(ExtractMacro(Ctrl, line + " %Focused%"), null, this.SW);
				break;
			case 3:
			case 4:
				ShellExecute(ExtractMacro(Ctrl, line + " %Selected%"), null, this.SW);
				break;
			case 5:
				MessageBox("Reserved future");
				break;
		}
		return S_OK;
	},

	Popup: function (FV, re) {
		const hMenu = api.CreatePopupMenu();
		const ContextMenu = FV.ViewMenu();
		if (ContextMenu) {
			ContextMenu.QueryContextMenu(hMenu, 0, 1, 0x7FFF, CMF_DEFAULTONLY);
		}
		for (let i = api.GetMenuItemCount(hMenu); i--;) {
			const s = api.GetMenuString(hMenu, i, MF_BYPOSITION);
			if (re.test(s)) {
				const pt = api.Memory("POINT");
				api.GetCursorPos(pt);
				const nVerb = api.TrackPopupMenuEx(api.GetSubMenu(hMenu, i), TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null, null);
				if (nVerb) {
					ContextMenu.InvokeCommand(0, te.hwnd, nVerb - 1, null, null, SW_SHOWNORMAL, 0, 0);
				}
				break;
			}
		}
		api.DestroyMenu(hMenu);
	},

	Run: function (Item, FV, s) {
		const hMenu = api.CreatePopupMenu();
		const ContextMenu = api.ContextMenu(Item);
		if (ContextMenu) {
			ContextMenu.QueryContextMenu(hMenu, 0, 1, 0x7FFF, CMF_DEFAULTONLY);
			s = ExtractMacro(FV, s);
			if (SameText(s, "Default")) {
				s = null;
			}
			ContextMenu.InvokeCommand(0, te.hwnd, s, null, null, SW_SHOWNORMAL, 0, 0);
		}
		api.DestroyMenu(hMenu);
	},

	ExecEx: function (s, nMode, Ctrl, hwnd, pt) {
		if (!Ctrl) {
			Ctrl = te.Ctrl(CTRL_FV);
		}
		if (!hwnd) {
			hwnd = Ctrl.hwnd;
		}
		if (!pt) {
			pt = api.Memory("POINT");
			api.GetCursorPos(pt);
		}
		let hr = S_OK;
		const lines = s.split(/\n/);
		Sync.XFinder.nMode = nMode || 0;
		const res = /Script:(.+)/i.exec(s);
		if (res) {
			const type = res[1].replace(/^\s+|\s+$/, "");
			lines.shift();
			return ExecScriptEx(Ctrl, lines.join("\n"), type, hwnd, pt, undefined, undefined, undefined, undefined, GetFolderView(Ctrl, pt));
		}
		for (let i in lines) {
			hr = Sync.XFinder.Exec(Ctrl, hwnd, pt, lines[i]);
			if (hr != S_OK) {
				break;
			}
		}
		return hr;
	},

	FormatDateTime: function (fmt, dt) {
		const ar =
			[
				["dddddd", LOCALE_SLONGDATE],
				["ddddd", LOCALE_SSHORTDATE],
				["tt", LOCALE_STIMEFORMAT]
			];
		const s = fmt.split("'");
		for (let j = 0; j < s.length; j += 2) {
			for (let i in ar) {
				const re = new RegExp(ar[i][0], "");
				if (re.test(s[j])) {
					s[j] = s[j].replace(re, api.GetLocaleInfo(LOCALE_USER_DEFAULT, ar[i][1]));
				}
			}
		}
		return api.GetDateFormat(LOCALE_USER_DEFAULT, 0, dt, api.GetTimeFormat(LOCALE_USER_DEFAULT, 0, dt, s.join("'")));
	}
};

AddEnv("X-Finder", function (Ctrl) {
	return (te.Data.Installed + "\\").replace(/\\\\$/, "\\");
});

AddEnv("Focused", function (Ctrl) {
	const FV = GetFolderView(Ctrl);
	if (FV) {
		const Focused = FV.FocusedItem;
		if (Focused) {
			return api.GetDisplayNameOf(Focused, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
		}
	}
});

AddEnv("FocusedName", function (Ctrl) {
	const FV = GetFolderView(Ctrl);
	if (FV) {
		const Focused = FV.FocusedItem;
		if (Focused) {
			return fso.GetBaseName(api.GetDisplayNameOf(Focused, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING));
		}
	}
});

AddEnv("InstallDrive", function (Ctrl) {
	return fso.GetDriveName(api.GetModuleFileName(null));
});

AddEnv("sysdir", function (Ctrl) {
	return system32;
});

AddEnv("CurrentSelected", function (Ctrl) {
	const ar = [];
	const FV = GetFolderView(Ctrl);
	if (FV) {
		const Selected = FV.Items(SVGIO_SELECTION | SVGIO_FLAG_VIEWORDER);
		if (Selected) {
			for (let i = Selected.Count; i > 0; ar.unshift(PathQuoteSpaces(api.GetDisplayNameOf(Selected.Item(--i), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING)))) {
			}
		}
	}
	return ar.join(" ");
});

AddEnv("Other", function (Ctrl) {
	const TC = te.Ctrl(CTRL_TC);
	const cTC = te.Ctrls(CTRL_TC);
	let nId = TC.Id;
	const nLen = cTC.length;
	for (let i = nLen; i--;) {
		if (cTC[i].Id == nId) {
			nId = i;
			break;
		}
	}
	for (let i = (nId + 1) % nLen; i != nId; i = (i + 1) % nLen) {
		if (cTC[i].Visible) {
			return PathQuoteSpaces(api.GetDisplayNameOf(cTC[i].Selected, SHGDN_FORPARSING));
		}
	}
});

AddEnv("SendTo", function (Ctrl) {
	return api.GetDisplayNameOf(ssfSENDTO, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
});

AddEnv("FileContents", function (Ctrl) {
	let s = "";
	const FV = GetFolderView(Ctrl);
	if (FV) {
		const Focused = FV.FocusedItem;
		if (Focused) {
			s = ReadTextFile(Focused.Path, true);
		}
	}
	return s;
});

AddEnv("Clipboard", function (Ctrl) {
	let s = clipboardData.getData("text");
	if (!s) {
		s = "";
		const Items = api.OleGetClipboard();
		for (let i = 0; i < Items.Count; i++) {
			s += api.GetDisplayNameOf(Items.Item(i), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING) + "\n";
		}
	}
	return s;
});

AddEnv("Clipboard1", function (Ctrl) {
	let s = clipboardData.getData("text");
	if (!s) {
		s = [];
		const Items = api.OleGetClipboard();
		for (let i = 0; i < Items.Count; i++) {
			s.push(PathQuoteSpaces(api.GetDisplayNameOf(Items.Item(i), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING)));
		}
		return s.join(" ");
	}
	return s.replace(/[\r\n]/g, " ");
});

AddEnv("Attrib", function (Ctrl) {
	const s = [];
	const FV = GetFolderView(Ctrl);
	if (FV) {
		const FindData = api.Memory("WIN32_FIND_DATA");
		api.SHGetDataFromIDList(FV.FocusedItem, SHGDFIL_FINDDATA, FindData, FindData.Size);
		const a = { R: FILE_ATTRIBUTE_READONLY, A: FILE_ATTRIBUTE_ARCHIVE, S: FILE_ATTRIBUTE_SYSTEM, H: FILE_ATTRIBUTE_HIDDEN };
		for (let i in a) {
			s.push((FindData.dwFileAttributes & a[i] ? "+" : "-") + i);
		}
	}
	return s.join(" ");
});

AddEnv("TabName", function (Ctrl) {
	const FV = GetFolderView(Ctrl);
	if (FV) {
		return GetTabName(FV);
	}
});

AddEnv("TabColor", function (Ctrl) {
	const FV = GetFolderView(Ctrl);
	if (FV) {
		return RunEvent4("GetTabColor", FV);
	}
});

AddEnv("Address", function (Ctrl) {
	if (GetAddress) {
		return GetAddress();
	}
});

AddEnv("ImageSize", "96,96");

AddEvent("ReplaceMacroEx", [/%DateTime:([^%]*)%/ig, function (strMatch, ref1) {
	return Sync.XFinder.FormatDateTime(ref1, new Date());
}]);

AddEvent("ReplaceMacro", [/%TimeStamp:([^%]*)%/ig, function (Ctrl, re, res) {
	const FV = GetFolderView(Ctrl, pt);
	if (FV) {
		return Sync.XFinder.FormatDateTime(res[1], FV.FocusedItem.ModifyDate);
	}
}]);

AddType("X-Finder",
	{
		Exec: function (Ctrl, s, type, hwnd, pt) {
			return Sync.XFinder.ExecEx(s, 1, Ctrl, hwnd, pt);
		},

		Ref: function (s, pt) {
			const ar = [];
			for (let i in Sync.XFinder.Command) {
				ar.push(i.replace(/^[a-z]/g, function (s) { return s.toUpperCase(); }) + ":");
			}
			ar.sort();
			return (s ? s + "\n" : "") + g_basic.Popup(ar, s, pt);
		}

	});

if (!window.WScript) {
	WScript = {};
}

WScript.CreateObject = function (strProgID) {
	return te.CreateObject(strProgID);
}

WScript.GetObject = function (strProgID) {
	return te.GetObject(strProgID);
}

WScript.Echo = function (s) {
	return MessageBox(s);
}

WScript.Sleep = function (intTime) {
	return api.Sleep(intTime);
}

WScript.Open = function (path, bNew) {
	return Navigate(path, bNew ? SBSP_NEWBROWSER : SBSP_SAMEBROWSER);
}

WScript.Exec = function (s, nMode) {
	return Sync.XFinder.ExecEx(s, nMode !== undefined ? nMode : 1) == S_OK;
}

WScript.Env = function (s, strNew) {
	if (strNew === undefined) {
		if (/%/.test(s)) {
			return ExtractMacro(te, s);
		}
		return ExtractMacro(te, '%' + s + '%');
	}
	return Sync.XFinder.set(te, te.hwnd, pt, [s, strNew].join("="));
}

WScript.Col = function (s) {
	const ar = [];
	s = s.replace(/ *"([^"]*)"([, ]?)| *([^, ]*)([, ]?)/g, function (strMatch, r1, r2, r3, r4) {
		if (r1 || r2 || r3 || r4) {
			ar.push(r1 || r3);
		}
		return "";
	});
	return api.CommandLineToArgv(ar);
}

WScript.DoDragDrop = function (Items) {
	const pdwEffect = [DROPEFFECT_COPY | DROPEFFECT_MOVE | DROPEFFECT_LINK];
	return api.SHDoDragDrop(null, Items, te, pdwEffect[0], pdwEffect);
}

WScript.Include = function (fn) {
	importScripts(fn);
}
