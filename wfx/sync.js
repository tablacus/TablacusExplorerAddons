const Addon_Id = "wfx";
const item = GetAddonElement(Addon_Id);

Sync.WFX = {
	tidNotify: {}, Use: [], Cnt: [], pdb: [],
	xml: OpenXml("wfx.xml", false, true),
	dbfile: BuildPath(te.Data.DataFolder, "config\\wfx_" + (api.CreateObject("WScript.Network").ComputerName.toLowerCase()) + ".bin"),

	IsHandle: function (Ctrl) {
		return Sync.WFX.GetObject(Ctrl) != null;
	},

	GetObject: function (Ctrl) {
		if (!Sync.WFX.DLL) {
			return;
		}
		const lib = { file: "string" === typeof Ctrl ? Ctrl : api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL) };
		const re = /^(\\{3})([^\\]*)(.*)/.exec(lib.file);
		if (!re) {
			return;
		}
		if (!Sync.WFX.Obj) {
			Sync.WFX.Init();
		}

		const Obj = Sync.WFX.Obj[re[2]];
		if (Obj) {
			if (!Obj.X) {
				Obj.X = Sync.WFX.DLL.open(Obj.dllPath);
				if (Obj.X.FsInit) {
					if (Obj.X.FsInit(Obj.PluginNr, this.ArrayProc, this.ProgressProc, this.LogProc, this.RequestProc) == 0) {
						Obj.X.FsSetDefaultParams(BuildPath(te.Data.DataFolder, "config\\fsplugin.ini"));
						Obj.X.FsSetCryptCallback(this.CryptProc, Obj.PluginNr, 1);
					}
				}
			}
			lib.X = Obj.X;
			lib.root = re[1] + re[2];
			lib.path = re[3] || "\\";
			lib.PluginNr = Obj.PluginNr;
			return lib;
		}
	},

	Init: function () {
		Sync.WFX.Obj = {};
		Sync.WFX.Root = [];
		Sync.WFX.Obj[""] = {
			X: {
				hFind: 0,
				hash: {},

				FsFindFirst: function (path, wfd) {
					if (Sync.WFX.Root.length) {
						const hFind = this.hFind++;
						this.hFind = this.hFind % MAXINT;
						this.hash[hFind] = 0;
						if (this.FsFindNext(hFind, wfd)) {
							return hFind;
						}
					}
					return -1;
				},

				FsFindNext: function (hFind, wfd) {
					if (isFinite(this.hash[hFind])) {
						wfd.cFileName = Sync.WFX.Root[this.hash[hFind]++];
						if (wfd.cFileName) {
							wfd.dwFileAttributes = FILE_ATTRIBUTE_DIRECTORY;
							return true;
						}
					}
					return false;
				},

				FsFindClose: function (hFind) {
					delete this.hash[hFind];
				},

				FsExecuteFile: function (MainWin, RemoteName, Verb) {
					if (Verb.toLowerCase() == "properties") {
						const lib = Sync.WFX.GetObject('\\\\' + RemoteName[0]);
						if (lib && lib.X) {
							lib.X.FsExecuteFile(MainWin, ["\\"], Verb);
						}
					}
				}
			}
		}

		Sync.WFX.Root = [];
		let items = Sync.WFX.xml.getElementsByTagName("Item");
		for (let i = 0; i < items.length; ++i) {
			const dllPath = (ExtractPath(te, items[i].getAttribute("Path")) + (g_.bit > 32 ? "64" : "")).replace(/\.u(wfx64)$/, ".$1");
			const WFX = Sync.WFX.DLL.open(dllPath);
			if (WFX && WFX.FsInit) {
				const s = items[i].getAttribute("Name");
				Sync.WFX.Root.push(s);
				Sync.WFX.Obj[s] = {
					dllPath: dllPath,
					PluginNr: Sync.WFX.Root.length
				}
			}
		}
		items = Sync.WFX.xml.getElementsByTagName("MP");
		if (items.length) {
			Sync.WFX.MP = Sync.WFX.ED(api.base64_decode(items[0].text, true));
			if (items[0].getAttribute("CRC") != api.CRC32(Sync.WFX.MP)) {
				Sync.WFX.MP = "";
			}
		}
		items = Sync.WFX.xml.getElementsByTagName("Conf");
		if (items.length) {
			Sync.WFX.NoExSort = items[0].getAttribute("NoExSort");
		}
		let s = "";
		try {
			const ado = api.CreateObject("ads");
			ado.Type = adTypeBinary;
			ado.Open();
			ado.LoadFromFile(Sync.WFX.dbfile);
			s = api.CryptUnprotectData(ado.Read(adReadAll), Sync.WFX.MP, true);
			ado.Close();
		} catch (e) {
			s = "";
		}
		if (s) {
			const line = s.split(/\n/);
			for (let i in line) {
				if (line[i]) {
					const col = line[i].split(/\t/);
					let db = Sync.WFX.pdb[col[0]];
					if (!db) {
						Sync.WFX.pdb[col[0]] = db = {}
					}
					db[col[1]] = col[2];
				}
			}
		}
	},

	GetObjectEx: function (Path) {
		const dwSessionId = api.sscanf(Path, BuildPath(te.Data.TempFolder, "%llx"));
		if (dwSessionId) {
			const cFV = te.Ctrls(CTRL_FV);
			for (let i in cFV) {
				const FV = cFV[i];
				if (FV.SessionId == dwSessionId) {
					const lib = Sync.WFX.GetObject(FV);
					if (lib) {
						lib.file = unescape(GetFileName(Path));
						return lib;
					}
				}
			}
		}
	},

	Refresh: function (Ctrl) {
		Ctrl.Refresh();
	},

	StringToVerb: {
		"paste": CommandID_PASTE,
		"delete": CommandID_DELETE,
		"copy": CommandID_COPY,
		"cut": CommandID_CUT,
		"properties": CommandID_PROPERTIES,
	},

	Command: function (Ctrl, Verb, ContextMenu) {
		if (Ctrl && Ctrl.Type <= CTRL_EB) {
			const lib = Sync.WFX.GetObject(Ctrl);
			if (lib) {
				switch ("string" === typeof Verb ? Sync.WFX.StringToVerb[Verb.toLowerCase()] : Verb + 1) {
					case CommandID_PASTE:
						Sync.WFX.Append(Ctrl, api.OleGetClipboard());
						return S_OK;
					case CommandID_DELETE:
						Sync.WFX.Delete(Ctrl);
						return S_OK;
					case CommandID_COPY:
					case CommandID_CUT:
						api.OleSetClipboard(Ctrl.SelectedItems());
						Sync.WFX.ClipId = api.sprintf(9, "%x", Ctrl.SessionId);
						Sync.WFX.ClipPath = lib.file;
						return S_OK;
					case CommandID_PROPERTIES:
						const Selected = Ctrl.SelectedItems();
						if (Selected.Count) {
							if (lib.X.FsExecuteFile) {
								lib.X.FsExecuteFile(te.hwnd, [BuildPath(lib.path, unescape(GetFileName(Selected.Item(0).Path)))], "properties")
								return S_OK;
							}
						}
						break;
				}
			}
		}
	},

	Append: function (Ctrl, Items) {
		if (!Items.Count) {
			return;
		}
		const lib = Sync.WFX.GetObject(Ctrl);
		if (lib && lib.X.FsPutFile) {
			Sync.WFX.Connect(lib);
			FsResult = 0;
			let bRefresh = false;
			Sync.WFX.Progress = api.CreateObject("ProgressDialog");
			Sync.WFX.Progress.StartProgressDialog(te.hwnd, null, 0);
			const fl = [];
			try {
				Sync.WFX.Progress.SetLine(1, api.LoadString(hShell32, 33260) || api.LoadString(hShell32, 6478), true);
				Sync.WFX.Cnt = [0, 0, 0, 0, 0];
				if (Sync.WFX.LocalList(lib, Items, "", fl) == 0) {
					Sync.WFX.ShowLine(5954, 32946);
					for (; fl.length && !Sync.WFX.Progress.HasUserCancelled(); ++Sync.WFX.Cnt[0]) {
						const item = fl.shift();
						const rfn = BuildPath(lib.path, item[0]);
						Sync.WFX.Cnt[4] = item[3];
						Sync.WFX.Progress.SetLine(2, item[0], true);
						if (item[1]) {
							lib.X.FsMkDir(rfn);
						} else {
							FsResult = lib.X.FsPutFile(item[2], rfn, 1);
							if (FsResult) {
								break;
							}
						}
						Sync.WFX.Cnt[2] += item[3];
						if (!/\\/.test(item[0])) {
							bRefresh = true;
						}
					}
				}
				if (Sync.WFX.Progress.HasUserCancelled()) {
					FsResult = 5;
				}
			} catch (e) {
				FsResult = e;
			}
			Sync.WFX.Progress.StopProgressDialog();
			delete Sync.WFX.Progress;
			if (FsResult || bRefresh) {
				Ctrl.Refresh();
				if (FsResult) {
					Sync.WFX.ShowError(FsResult);
				}
			}
		}
	},

	RemoteList: function (lib, fl, items) {
		let Result = Sync.WFX.Progress.HasUserCancelled();
		Sync.WFX.Cnt[1] += items.length;
		while (items.length && !Result) {
			let wfd = api.Memory("WIN32_FIND_DATA");
			api.SHGetDataFromIDList(items.shift(), SHGDFIL_FINDDATA, wfd, wfd.Size);
			let nDog = 99999;
			const arDir = [{ path: "", wfd: wfd }];
			while (arDir.length && !Result) {
				const o = arDir.pop();
				const path = BuildPath(o.path, unescape(o.wfd.cFileName));
				fl.push({
					path: path,
					SizeLow: o.wfd.nFileSizeLow,
					SizeHigh: o.wfd.nFileSizeHigh,
					LastWriteTime: o.wfd.ftLastWriteTime,
					Attr: o.wfd.dwFileAttributes
				});
				if (o.wfd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) {
					wfd = {};
					const hFind = lib.X.FsFindFirst(BuildPath(lib.path, path), wfd);
					if (hFind != -1) {
						do {
							if (!api.PathMatchSpec(wfd.cFileName, ".;..")) {
								++Sync.WFX.Cnt[1];
								Sync.WFX.Unix2Win(wfd);
								if (wfd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) {
									arDir.push({ path: path, wfd: wfd });
								} else {
									fl.push({
										path: BuildPath(path, wfd.cFileName),
										SizeLow: wfd.nFileSizeLow,
										SizeHigh: wfd.nFileSizeHigh,
										LastWriteTime: wfd.ftLastWriteTime,
										Attr: wfd.dwFileAttributes
									});
								}
							}
							Result = Sync.WFX.Progress && Sync.WFX.Progress.HasUserCancelled();
							wfd = {};
						} while (!Result && lib.X.FsFindNext(hFind, wfd));
						lib.X.FsFindClose(hFind);
					}
				} else {
					Sync.WFX.Cnt[3] += api.QuadPart(wfd.nFileSizeLow, wfd.nFileSizeHigh);
				}
				if (nDog-- <= 0) {
					Result = true;
				}
			}
		}
		return Result ? 1 : 0;
	},

	LocalList: function (lib, Items, path, fl) {
		Sync.WFX.Cnt[1] += Items.Count;
		for (let i = 0; i < Items.Count; ++i) {
			if (Sync.WFX.Progress && Sync.WFX.Progress.HasUserCancelled()) {
				return 1;
			}
			const Item = Items.Item(i);
			const wfd = api.Memory("WIN32_FIND_DATA");
			api.SHGetDataFromIDList(Item, SHGDFIL_FINDDATA, wfd, wfd.Size);
			const fn = BuildPath(path, wfd.cFileName);
			if (wfd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) {
				if (lib.X.FsMkDir) {
					fl.push([fn, 1, "", 0]);
					if (this.LocalList(lib, Item.GetFolder.Items(), fn, fl)) {
						return 1;
					}
				}
				continue;
			}
			const fs = api.QuadPart(wfd.nFileSizeLow, wfd.nFileSizeHigh);
			fl.push([fn, 0, Item.Path, fs]);
			Sync.WFX.Cnt[3] += fs;
		}
		return 0;
	},

	Delete: function (Ctrl) {
		const Items = Ctrl.SelectedItems();
		if (!Items.Count || !confirmOk()) {
			return;
		}
		const lib = Sync.WFX.GetObject(Ctrl.FolderItem.Path);
		if (lib) {
			let FsResult = 0;
			let bRefresh = false;
			Sync.WFX.Connect(lib);
			Sync.WFX.Progress = api.CreateObject("ProgressDialog");
			Sync.WFX.Progress.StartProgressDialog(te.hwnd, null, 0);
			try {
				Sync.WFX.Progress.SetLine(1, api.LoadString(hShell32, 33269) || api.LoadString(hShell32, 6478), true);
				Sync.WFX.Cnt = [0, 0, 0, 0, 0];
				const items = [], fl = [];
				for (let i = Items.Count; i--;) {
					items.unshift(Items.Item(i));
				}
				if (Sync.WFX.RemoteList(lib, fl, items) == 0) {
					Sync.WFX.ShowLine(5955, 32947);
					Sync.WFX.Cnt[3] = 0;
					for (; fl.length && !Sync.WFX.Progress.HasUserCancelled(); ++Sync.WFX.Cnt[0]) {
						const item = fl.pop();
						const path = BuildPath(lib.path, item.path);
						Sync.WFX.Progress.SetLine(2, item.path, true);
						if (item.Attr & FILE_ATTRIBUTE_DIRECTORY) {
							if (lib.X.FsRemoveDir) {
								if (!lib.X.FsRemoveDir(path)) {
									FsResult = 4;
									break;
								}
							}
						} else if (lib.X.FsDeleteFile) {
							if (!lib.X.FsDeleteFile(path)) {
								FsResult = 4;
								break;
							}
						}
						if (!/\\/.test(item.path)) {
							bRefresh = true;
						}
					}
				}
				if (Sync.WFX.Progress.HasUserCancelled()) {
					FsResult = 5;
				}
			} catch (e) {
				FsResult = e;
			}
			Sync.WFX.Progress.StopProgressDialog();
			delete Sync.WFX.Progress;
			if (FsResult || bRefresh) {
				Ctrl.Refresh();
				if (FsResult) {
					Sync.WFX.ShowError(FsResult);
				}
			}
		}
	},

	Enum: function (pid, Ctrl, fncb) {
		const lib = Sync.WFX.GetObject(pid.Path);
		if (Ctrl && lib) {
			const Items = api.CreateObject("FolderItems");
			Sync.WFX.Connect(lib);
			const root = BuildPath(te.Data.TempFolder, Ctrl.SessionId.toString(16));
			const wfd = {};
			const hFind = lib.X.FsFindFirst(lib.path, wfd);
			if (hFind != -1) {
				do {
					const fn = wfd.cFileName.replace(/([%\\/:\*\?"<>|]+)/g, function (all, re1) {
						return escape(re1);
					});
					if (!/^\.\.?$|^$/.test(fn)) {
						Sync.WFX.Unix2Win(wfd);
						Items.AddItem(api.SHSimpleIDListFromPath(BuildPath(root, fn), wfd.dwFileAttributes, wfd.ftLastWriteTime, api.QuadPart(wfd.nFileSizeLow, wfd.nFileSizeHigh)));
					}
				} while (lib.X.FsFindNext(hFind, wfd));
				lib.X.FsFindClose(hFind);
			}
			return Items;
		}
	},

	ReplaceColumns: function (Ctrl, pid, s) {
		if (s.indexOf("%") >= 0) {
			return unescape(s);
		}
	},

	CreateFolder: function (path) {
		const s = GetParentFolderName(path);
		if (s.length > 3 && !fso.FolderExists(s)) {
			this.CreateFolder(s);
		}
		if (!fso.FolderExists(path)) {
			fso.CreateFolder(path);
		}
	},

	ChangeNotify: function (path) {
		const strMatch = path + ";" + path + "\\*";
		const cFV = te.Ctrls(CTRL_FV);
		for (let i in cFV) {
			const FV = cFV[i];
			if (FV.hwndView) {
				if (api.PathMatchSpec(api.GetDisplayNameOf(FV, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL), strMatch)) {
					if (Sync.WFX.tidNotify[FV.Id]) {
						clearTimeout(Sync.WFX.tidNotify[FV.Id]);
					}
					(function (FV) {
						Sync.WFX.tidNotify[FV.Id] = setTimeout(function () {
							delete Sync.WFX.tidNotify[FV.Id];
							FV.Refresh();
						}, 500);
					})(FV);
				}
			}
		}
	},

	Connect: function (lib) {
		if (lib.X.FsDisconnect) {
			const re = /^\\([^\\]+)/.exec(lib.path);
			if (re) {
				Sync.WFX.Use[BuildPath(lib.root, re[1])] = 1;
			}
		}
	},

	CheckDisconnect: function (Ctrl) {
		let bOk = true;
		for (let i in Sync.WFX.Use) {
			bOk = false;
			break;
		}
		if (bOk) {
			return;
		}
		if (Sync.WFX.tidClose) {
			clearTimeout(Sync.WFX.tidClose);
		}
		Sync.WFX.tidClose = setTimeout(function () {
			const Use = {};
			const cFV = te.Ctrls(CTRL_FV);
			for (let i in cFV) {
				const FV = cFV[i];
				if (FV.hwndView && FV.FolderItem) {
					const re = /^(\\{3}[^\\]+\\[^\\]+)/.exec(FV.FolderItem.Path);
					if (re) {
						Use[re[1]] = 1;
					}
				}
			}
			for (let i in Sync.WFX.Use) {
				if (!Use[i]) {
					const re = /^\\{3}([^\\]+)(.+)/.exec(i);
					if (re) {
						Sync.WFX.Obj[re[1]].X.FsDisconnect(re[2]);
					}
					delete Sync.WFX.Use[i];
				}
			}
		}, 999);
	},

	DefaultCommand: function (Ctrl, Selected) {
		if (Selected.Count) {
			const Item = Selected.Item(0);
			let path = api.GetDisplayNameOf(Item, SHGDN_FORPARSING | SHGDN_FORADDRESSBAR | SHGDN_ORIGINAL);
			if (Sync.WFX.IsHandle(path)) {
				Ctrl.Navigate(path);
				return S_OK;
			}
			const lib = Sync.WFX.GetObject(Ctrl);
			if (lib) {
				path = BuildPath(lib.path, unescape(Item.Name));
				if (IsFolderEx(Item)) {
					Ctrl.Navigate(BuildPath(lib.root, path));
				} else {
					const pRemote = [path];
					const iRes = lib.X.FsExecuteFile && lib.X.FsExecuteFile(te.hwnd, pRemote, "open");
					if (iRes == 0) {
						return S_OK;
					}
					const wfd = {};
					const hFind = lib.X.FsFindFirst(pRemote[0], wfd);
					if (hFind != -1 && wfd.dwFileAttributes < 0) {
						while (api.PathMatchSpec(wfd.cFileName, ".;..") && lib.X.FsFindNext(hFind, wfd)) {
						}
						lib.X.FsFindClose(hFind);
						if (!api.PathMatchSpec(wfd.cFileName, ".;..")) {
							Ctrl.Navigate(BuildPath(lib.root, pRemote[0]).replace(/\\$/, ""));
							return S_OK;
						}
					}
					if (iRes == -1) {
						return;
					}
				}
				return S_OK;
			}
		}
	},

	SetName: function (pid, Name) {
		const lib = Sync.WFX.GetObjectEx(pid.Path);
		if (lib && lib.X.FsRenMovFile) {
			Sync.WFX.Connect(lib);
			const wfd = api.Memory("WIN32_FIND_DATA");
			api.SHGetDataFromIDList(pid, SHGDFIL_FINDDATA, wfd, wfd.Size);
			const fn = BuildPath(lib.path, lib.file);
			const ri = {
				SizeLow: wfd.nFileSizeLow,
				SizeHigh: wfd.nFileSizeHigh,
				LastWriteTime: wfd.ftLastWriteTime,
				Attr: wfd.dwFileAttributes
			}
			if (ri.Attr & FILE_ATTRIBUTE_DIRECTORY) {
				ri.SizeLow = 0;
				ri.SizeHigh = 0xFFFFFFFF;
			}
			const r = lib.X.FsRenMovFile(fn, BuildPath(lib.path, Name), true, false, ri);
			if (r == 0) {
				Sync.WFX.ChangeNotify(BuildPath(lib.root, lib.path));
			} else {
				Sync.WFX.ShowError(r, fn);
			}
			return r;
		}
	},

	ShowError: function (r, path) {
		if (r == 5) {
			return;
		}
		setTimeout(function () {
			if (isFinite(r)) {
				const o = [0, 6327, 6146, 6175, 6173, 28743, 16771];
				MessageBox(api.LoadString(hShell32, o[r]) || api.sprintf(999, api.LoadString(hShell32, 4228), r), TITLE, MB_OK);
				return;
			}
			ShowError(r, path);
		}, 500);
	},

	ShowLine: function (s1, s2) {
		let i = Sync.WFX.Cnt[1];
		let s3 = 6466;
		if (g_.IEVer > 8) {
			s3 = i > 1 ? 38192 : 38193;
			if (i > 999) {
				i = i.toLocaleString();
			}
		}
		this.Progress.SetLine(1, [api.LoadString(hShell32, s1) || api.LoadString(hShell32, s2), " ", (api.LoadString(hShell32, s3) || "%s items").replace(/%1!ls!|%s/g, i), " (", api.StrFormatByteSize(Sync.WFX.Cnt[3]), ")"].join(""), true);
	},

	ProgressProc: function (PluginNr, SourceName, TargetName, PercentDone) {
		if (Sync.WFX.Progress) {
			let i = Sync.WFX.Cnt[1] - Sync.WFX.Cnt[0];
			if (i > 999 && document.documentMode > 8) {
				i = i.toLocaleString();
			}
			const ar = [api.LoadString(hShell32, 13581) || "Items remaining:", " ", i];
			if (Sync.WFX.Cnt[3]) {
				i = Sync.WFX.Cnt[2] + Math.floor(Sync.WFX.Cnt[4] * PercentDone / 100);
				ar.push(" (", api.StrFormatByteSize(Sync.WFX.Cnt[3] - i), ")");
				i = i / Sync.WFX.Cnt[3] * 100;
			} else {
				i = (Sync.WFX.Cnt[0] * 100 + PercentDone) / Sync.WFX.Cnt[1];
			}
			Sync.WFX.Progress.SetLine(3, ar.join(""), true);
			return Sync.WFX.Progress.HasUserCancelled(i, 100, 2) ? 1 : 0;
		}
		return 0;
	},

	LogProc: function (PluginNr, MsgType, LogString) {
		if (Sync.Debug) {
			Sync.Debug.alert(LogString);
		} else {
			api.OutputDebugString(LogString);
		}
	},

	RequestProc: function (PluginNr, RequestType, CustomTitle, CustomText, pReturnedText) {
		if (RequestType < 8) {
			pReturnedText[0] = InputDialog([CustomTitle || TITLE, CustomText].join("\n"), pReturnedText[0]);
			return 1;
		}
		if (RequestType == 8) {
			MessageBox(CustomText, CustomTitle, MB_ICONINFORMATION | MB_OK);
			return 1;
		}
		if (RequestType == 9) {
			return confirmOk(CustomText, CustomTitle) ? 1 : 0;
		}
		if (RequestType == 10) {
			return confirmYN(CustomText, CustomTitle) ? 1 : 0;
		}
		return 1;
	},

	CryptProc: function (PluginNr, CryptoNumber, mode, ConnectionName, pPassword) {
		let db = Sync.WFX.pdb[Sync.WFX.Root[PluginNr - 1]];
		if (!db) {
			Sync.WFX.pdb[Sync.WFX.Root[PluginNr - 1]] = db = {};
		}
		switch (mode) {
			case 1://FS_CRYPT_SAVE_PASSWORD
				db[ConnectionName] = pPassword[0];
				Sync.WFX.bSave = true;
				return 0;
			case 2://FS_CRYPT_LOAD_PASSWORD
			case 3://FS_CRYPT_LOAD_PASSWORD_NO_UI
				pPassword[0] = db[ConnectionName];
				return pPassword[0] ? 0 : 3;
			case 4://FS_CRYPT_COPY_PASSWORD
				if (db[ConnectionName]) {
					db[pPassword[0]] = db[ConnectionName];
					Sync.WFX.bSave = true;
					return 0;
				}
				return 3;
			case 5://FS_CRYPT_MOVE_PASSWORD
				if (db[ConnectionName]) {
					db[pPassword[0]] = db[ConnectionName];
					delete db[ConnectionName];
					Sync.WFX.bSave = true;
					return 0;
				}
				return 3;
			case 6://FS_CRYPT_DELETE_PASSWORD
				if (db[ConnectionName]) {
					delete db[ConnectionName];
					Sync.WFX.bSave = true;
					return 0;
				}
				return 3;
		}
		return 6;
	},

	ED: function (s) {
		const ar = s.split("").reverse();
		for (let i in ar) {
			ar[i] = String.fromCharCode(ar[i].charCodeAt(0) ^ 13);
		}
		return ar.join("");
	},

	Unix2Win: function (wfd) {
		if (wfd.dwFileAttributes < 0) {
			if (wfd.dwReserved0 & 0x6000) {
				wfd.dwFileAttributes |= FILE_ATTRIBUTE_DIRECTORY;
			}
			if (!(wfd.dwReserved0 & 0x80)) {
				wfd.dwFileAttributes |= FILE_ATTRIBUTE_READONLY;
			}
		}
	},

	Properties: function (Ctrl) {
		const lib = Sync.WFX.GetObject(Ctrl);
		if (lib && lib.X) {
			lib.X.FsExecuteFile(te.hwnd, ["\\"], "properties");
		}
	},

	ArrayProc: function () {
		return [];
	},

	Finalize: function () {
		for (let i in Sync.WFX.Use) {
			const re = /^\\{3}([^\\]+)(.+)/.exec(i);
			if (re) {
				Sync.WFX.Obj[re[1]].X.FsDisconnect(re[2]);
			}
			delete Sync.WFX.Use[i];
		}
		delete Sync.WFX.Obj;
		CollectGarbage();
		delete Sync.WFX.DLL;
	}
}

const twfxPath = BuildPath(te.Data.Installed, ["addons\\wfx\\twfx", g_.bit, ".dll"].join(""));

Sync.WFX.DLL = api.DllGetClassObject(twfxPath, "{5396F915-5592-451c-8811-87314FC0EF11}");

AddEvent("Finalize", Sync.WFX.Finalize);

AddEvent("TranslatePath", function (Ctrl, Path) {
	if (Sync.WFX.IsHandle(Path)) {
		Ctrl.Enum = Sync.WFX.Enum;
		return ssfRESULTSFOLDER;
	}
}, true);

AddEvent("ReplacePath", function (FolderItem, Path) {
	const lib = Sync.WFX.GetObjectEx(Path);
	if (lib) {
		return BuildPath(lib.root, BuildPath(lib.path, lib.file));
	}
});

AddEvent("BeginDrag", function (Ctrl) {
	if (Sync.WFX.IsHandle(Ctrl)) {
		const pdwEffect = [DROPEFFECT_COPY | DROPEFFECT_MOVE | DROPEFFECT_LINK];
		api.SHDoDragDrop(null, Ctrl.SelectedItems(), Ctrl, pdwEffect[0], pdwEffect, true);
		return false;
	}
});

AddEvent("BeforeGetData", function (Ctrl, Items, nMode) {
	if (!Items.Count) {
		return;
	}
	let hr = S_OK;
	const ar = [], fl = [];
	for (let i = Items.Count; i--;) {
		const path = Items.Item(i).Path;
		if (api.PathMatchSpec(path, te.Data.TempFolder + "*") && !fso.FileExists(path)) {
			ar.unshift(Items.Item(i));
		}
	}
	if (!ar.length) {
		return;
	}
	const strSessionId = GetParentFolderName(ar[0].Path).replace(te.Data.TempFolder + "\\", "").replace(/\\.*/, "");
	const lib = Sync.WFX.GetObject(strSessionId == Sync.WFX.ClipId ? Sync.WFX.ClipPath : Ctrl);
	if (lib && lib.X.FsGetFile) {
		let FsResult = 0;
		const root = BuildPath(te.Data.TempFolder, strSessionId);
		Sync.WFX.CreateFolder(root);
		wsh.CurrentDirectory = root;
		Sync.WFX.Progress = api.CreateObject("ProgressDialog");
		Sync.WFX.Progress.StartProgressDialog(te.hwnd, null, 0);
		try {
			Sync.WFX.Progress.SetLine(1, api.LoadString(hShell32, 33260) || api.LoadString(hShell32, 6478), true);
			Sync.WFX.Cnt = [0, 0, 0, 0, 0];
			if (Sync.WFX.RemoteList(lib, fl, ar) == 0) {
				Sync.WFX.ShowLine(5954, 32946);
				for (; fl.length && !Sync.WFX.Progress.HasUserCancelled(); ++Sync.WFX.Cnt[0]) {
					const item = fl.shift();
					const path = BuildPath(lib.path, item.path);
					const lfn = BuildPath(root, item.path);
					Sync.WFX.Cnt[4] = api.QuadPart(item.SizeLow, item.SizeHigh);
					Sync.WFX.Progress.SetLine(2, item.path, true);
					if (item.Attr & FILE_ATTRIBUTE_DIRECTORY) {
						Sync.WFX.CreateFolder(lfn);
					} else {
						FsResult = lib.X.FsGetFile(path, lfn, 1, item);
						if (FsResult) {
							break;
						}
					}
					Sync.WFX.Cnt[2] += Sync.WFX.Cnt[4];
				}
			}
			if (Sync.WFX.Progress.HasUserCancelled()) {
				FsResult = 5;
			}
		} catch (e) {
			FsResult = e;
		}
		Sync.WFX.Progress.StopProgressDialog();
		if (Sync.WFX.Progress.HasUserCancelled()) {
			hr = E_ABORT;
		}
		delete Sync.WFX.Progress;
		wsh.CurrentDirectory = te.Data.TempFolder;
		if (FsResult) {
			Ctrl.Refresh();
			Sync.WFX.ShowError(FsResult);
		}
	}
	return hr;
});

AddEvent("Context", function (Ctrl, hMenu, nPos, Selected, item, ContextMenu) {
	const lib = Sync.WFX.GetObject(Ctrl);
	if (lib) {
		const ar = [];
		if (!lib.X.FsDeleteFile) {
			ar.push("delete");
		}
		if (!lib.X.FsRenMovFile) {
			ar.push("rename");
		}
		if (ar.length) {
			RemoveCommand(hMenu, ContextMenu, ar.join(";"));
		}
	}
	return nPos;
});

AddEvent("Background", function (Ctrl, hMenu, nPos, Selected, item, ContextMenu) {
	const lib = Sync.WFX.GetObject(Ctrl);
	if (lib) {
		api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, ++nPos, api.LoadString(hShell32, 33555));
		ExtraMenuCommand[nPos] = Sync.WFX.Properties;
	}
	return nPos;
});

AddEvent("Command", function (Ctrl, hwnd, msg, wParam, lParam) {
	const hr = Sync.WFX.Command(Ctrl, wParam & 0xfff);
	if (isFinite(hr)) {
		return hr;
	}
}, true);

AddEvent("InvokeCommand", function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon) {
	const hr = Sync.WFX.Command(ContextMenu.FolderView, Verb, ContextMenu);
	if (isFinite(hr)) {
		return hr;
	}
}, true);

AddEvent("DefaultCommand", Sync.WFX.DefaultCommand, true);

AddEvent("ILGetParent", function (FolderItem) {
	const path = FolderItem.Path;
	const re = /^(\\{3})([^\\]*)(.*)/.exec(path);
	if (re) {
		if (!re[2]) {
			return ssfDESKTOP;
		}
		const lib = Sync.WFX.GetObject(path);
		if (lib) {
			return re[3] ? BuildPath(lib.root, GetParentFolderName(lib.path)) : re[1];
		}
	}
});

AddEvent("DragEnter", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
	if (Ctrl.Type <= CTRL_EB || Ctrl.Type == CTRL_DT) {
		if (Sync.WFX.IsHandle(Ctrl)) {
			return S_OK;
		}
	}
});

AddEvent("DragOver", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
	if (Ctrl.Type <= CTRL_EB || Ctrl.Type == CTRL_DT) {
		if (Sync.WFX.IsHandle(Ctrl)) {
			pdwEffect[0] = DROPEFFECT_COPY;
			return S_OK;
		}
	}
});

AddEvent("Drop", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
	if (Sync.WFX.IsHandle(Ctrl)) {
		Sync.WFX.Append(Ctrl, dataObj);
		return S_OK;
	}
});

AddEvent("DragLeave", function (Ctrl) {
	return S_OK;
});

AddEvent("AddonDisabled", function (Id) {
	if (Id.toLowerCase() == "wfx") {
		Sync.WFX.Finalize();
	}
});

AddEvent("BeforeNavigate", function (Ctrl, fs, wFlags, Prev) {
	if (Ctrl.Type <= CTRL_EB && Sync.WFX.IsHandle(Prev)) {
		DeleteItem(BuildPath(te.Data.TempFolder, Ctrl.SessionId.toString(16)));
	}
});

AddEvent("ViewCreated", function (Ctrl) {
	if (Sync.WFX.IsHandle(Ctrl)) {
		ColumnsReplace(Ctrl, "Name", HDF_LEFT, Sync.WFX.ReplaceColumns);
	}
});

AddEvent("BeginLabelEdit", function (Ctrl) {
	if (Ctrl.Type <= CTRL_EB) {
		const lib = Sync.WFX.GetObject(Ctrl);
		if (lib && !lib.X.FsRenMovFile) {
			return 1;
		}
	}
});

AddEvent("EndLabelEdit", function (Ctrl, Name) {
	if (Ctrl.Type <= CTRL_EB && Name) {
		const lib = Sync.WFX.GetObject(Ctrl);
		if (lib && lib.X.FsRenMovFile) {
			const Item = Ctrl.FocusedItem;
			if (Item) {
				Sync.WFX.SetName(Item, Name);
			}
			return 1;
		}
	}
}, true);

AddEvent("SetName", Sync.WFX.SetName);

AddEvent("CreateFolder", function (path) {
	const lib = Sync.WFX.GetObject(path);
	if (lib) {
		if (lib.X.FsMkDir && lib.X.FsMkDir(lib.path)) {
			Sync.WFX.ChangeNotify(BuildPath(lib.root, GetParentFolderName(lib.path)));
			return true;
		}
		MessageBox(api.LoadString(hShell32, 6461), TITLE, MB_ICONSTOP | MB_OK);
		return false;
	}
}, true);

AddEvent("CreateFile", function (path) {
	const lib = Sync.WFX.GetObject(path);
	if (lib) {
		if (lib.X.FsPutFile) {
			const sLocal = BuildPath(te.Data.TempFolder, fso.GetTempName());
			fso.CreateTextFile(sLocal).Close();
			if (lib.X.FsPutFile(sLocal, lib.path, 0) == 0) {
				DeleteItem(sLocal);
				Sync.WFX.ChangeNotify(BuildPath(lib.root, GetParentFolderName(lib.path)));
				return true;
			}
			DeleteItem(sLocal);
		}
		MessageBox(api.LoadString(hShell32, 8728).replace(/%2!ls!/, lib.path).replace(/%1!ls!/, ""), TITLE, MB_ICONSTOP | MB_OK);
		return false;
	}
}, true);

AddEvent("SetFileTime", function (path, ctime, atime, mtime) {
	const lib = Sync.WFX.GetObjectEx(path);
	if (lib && lib.X.FsSetTime) {
		Sync.WFX.Connect(lib);
		if (lib.X.FsSetTime(BuildPath(lib.path, lib.file), ctime, atime, mtime)) {
			Sync.WFX.ChangeNotify(BuildPath(lib.root, lib.path));
			return true;
		}
		return false;
	}
}, true);

AddEvent("SetFileAttributes", function (path, attr) {
	const lib = Sync.WFX.GetObjectEx(path);
	if (lib && lib.X.FsSetAttr) {
		Sync.WFX.Connect(lib);
		if (lib.X.FsSetAttr(BuildPath(lib.path, lib.file), attr)) {
			Sync.WFX.ChangeNotify(BuildPath(lib.root, lib.path));
			return true;
		}
		return false;
	}
}, true);

AddEvent("ToolTip", function (Ctrl, Index) {
	if (Ctrl.Type <= CTRL_EB) {
		if (Sync.WFX.IsHandle(Ctrl)) {
			const Item = Ctrl.Items.Item(Index);
			if (Item.IsFolder) {
				const s = FormatDateTime(Item.ModifyDate);
				return s ? api.PSGetDisplayName("Write") + " : " + s : "";
			}
		}
	}
}, true);

AddEvent("GetIconImage", function (Ctrl, ckBk, bSimple) {
	if (g_.IEVer >= 8) {
		const lib = Sync.WFX.GetObject(Ctrl);
		if (lib) {
			if (lib.X.FsExtractCustomIcon) {
				const phIcon = [0];
				const r = lib.X.FsExtractCustomIcon(lib.path + "\\", 1, phIcon);
				if (r == 1 || r == 2) {
					const image = te.WICBitmap().FromHICON(phIcon[0], ckBk);
					if (r == 2) {
						api.DestroyIcon(phIcon[0]);
					}
					return image.DataURI("image/png");
				}
			}
			return MakeImgDataEx("folder:closed", bSimple, 16, ckBk);
		}
	}
});

AddEvent("AddItems", function (Items, pid) {
	if (api.ILIsEqual(pid, ssfDRIVES)) {
		Items.AddItem("\\\\\\");
	}
});

AddEvent("SaveConfig", function () {
	if (Sync.WFX.bSave) {
		const ar = [];
		for (let i in Sync.WFX.pdb) {
			const db = Sync.WFX.pdb[i];
			for (j in db) {
				if (i && j && db[j]) {
					ar.push([i, j, db[j]].join("\t"));
				}
			}
		}
		try {
			const ado = api.CreateObject("ads");
			ado.Type = adTypeBinary;
			ado.Open();
			ado.Write(api.CryptProtectData(ar.join("\n"), Sync.WFX.MP));
			ado.SaveToFile(Sync.WFX.dbfile, adSaveCreateOverWrite);
			ado.Close();
			Sync.WFX.bSave = false;
		} catch (e) { }
	}
});

AddEvent("CloseView", Sync.WFX.CheckDisconnect);
AddEvent("ChangeView", Sync.WFX.CheckDisconnect);

AddEvent("ColumnClick", function (Ctrl, iItem) {
	if (Ctrl.Type <= CTRL_EB && !Sync.WFX.NoExSort) {
		if (Sync.WFX.IsHandle(Ctrl)) {
			const cColumns = api.CommandLineToArgv(Ctrl.Columns(1));
			const s = cColumns[iItem * 2];
			if (api.PathMatchSpec(s, "System.ItemNameDisplay;System.DateModified")) {
				const s1 = Ctrl.SortColumns;
				const s2 = 'prop:' + s + ';System.ItemTypeText;';
				const s3 = s2.replace(":", ":-");
				if (s1 != s2 && s1 != s3) {
					Ctrl.SortColumns = (s1 == s2) ? s3 : s2;
					return S_OK;
				}
			}
		}
	}
});

AddEvent("Sort", function (Ctrl) {
	if (Ctrl.Type <= CTRL_EB && !Sync.WFX.NoExSort) {
		if (Sync.WFX.IsHandle(Ctrl)) {
			const s1 = Ctrl.SortColumns;
			if (/^prop:\-?System\.ItemNameDisplay;$|^prop:\-?System\.DateModified;$/.test(s1)) {
				setTimeout(function () {
					Ctrl.SortColumns = s1 + 'System.ItemTypeText;';
				}, 99);
			}
		}
	}
});

const cFV = te.Ctrls(CTRL_FV);
for (let i in cFV) {
	const FV = cFV[i];
	if (Sync.WFX.IsHandle(FV)) {
		ColumnsReplace(FV, "Name", HDF_LEFT, Sync.WFX.ReplaceColumns);
		if (FV.Enum) {
			FV.Enum = Sync.WFX.Enum;
		}
	}
}
