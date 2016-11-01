var Addon_Id = "wfx";
var item = GetAddonElement(Addon_Id);

if (!te.Data.AddonsData.WFX) {
	te.Data.AddonsData.WFX = te.Object();
}

Addons.WFX =
{
	tid: [], tidNotify: {}, Use: [],

	xml: OpenXml("wfx.xml", false, true),

	IsHandle: function (Ctrl)
	{
		return Addons.WFX.GetObject(Ctrl) != null;
	},

	GetObject: function (Ctrl)
	{
		if (!Addons.WFX.DLL) {
			return;
		}
		var lib = { file: typeof(Ctrl) == "string" ? Ctrl : api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING) };
		var re = /^(\\{3})([^\\]*)(.*)/.exec(lib.file);
		if (!re) {
			return;
		}
		if (!Addons.WFX.Obj) {
			Addons.WFX.Init();
		}

		var Obj = Addons.WFX.Obj[re[2]];
		if (Obj) {
			if (!Obj.X) {
				Obj.X = Addons.WFX.DLL.open(Obj.dllPath);
				if (Obj.X.FsInit) {
					if (Obj.X.FsInit(lib.PluginNr, this.ArrayProc, this.ProgressProc, this.LogProc, this.RequestProc) == 0) {
						Obj.X.FsSetDefaultParams(fso.BuildPath(te.Data.DataFolder, "config\\fsplugin.ini"));
						Obj.X.FsSetCryptCallback(this.CryptProc, lib.PluginNr, 1);
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

	Init: function ()
	{
		Addons.WFX.Obj = {};
		Addons.WFX.Root = [];
		Addons.WFX.Obj[""] = 
		{
			X:
			{
				hFind: 0,
				hash: {},

				FsFindFirst: function (path, wfd)
				{
					if (Addons.WFX.Root.length) {
						var hFind = this.hFind++;
						this.hFind = this.hFind % MAXINT;
						this.hash[hFind] = 0;
						if (this.FsFindNext(hFind, wfd)) {
							return hFind;
						}
					}
					return -1;
				},

				FsFindNext: function (hFind, wfd)
				{
					if (isFinite(this.hash[hFind])) {
						wfd.cFileName = Addons.WFX.Root[this.hash[hFind]++];
						if (wfd.cFileName) {
							wfd.dwFileAttributes = FILE_ATTRIBUTE_DIRECTORY;
							return true;
						}
					}
					return false;
				},

				FsFindClose: function (hFind)
				{
					delete this.hash[hFind];
				},

				FsExecuteFile: function (MainWin, RemoteName, Verb)
				{
					if (Verb.toLowerCase() == "properties") {
						var lib =  Addons.WFX.GetObject('\\\\' + RemoteName[0]);
						if (lib && lib.X) {
							lib.X.FsExecuteFile(MainWin, ["\\"], Verb);
						}
					}
				}
			}
		}

		Addons.WFX.Root = [];
		var items = Addons.WFX.xml.getElementsByTagName("Item");
		for (var i = 0; i < items.length; i++) {
			var dllPath = (ExtractMacro(te, items[i].getAttribute("Path")) + (api.sizeof("HANDLE") > 4 ? "64" : "")).replace(/\.u(wfx64)$/, ".$1");
			var WFX = Addons.WFX.DLL.open(dllPath);
			if (WFX) {
				if (WFX.FsInit) {
					var s = items[i].getAttribute("Name");
					Addons.WFX.Obj[s] = 
					{
						dllPath: dllPath,
						PluginNr: i + 1
					}
					Addons.WFX.Root.push(s);
				}
			}
		}
	},

	GetObjectEx: function (Path)
	{
		var root = fso.BuildPath(fso.GetSpecialFolder(2).Path, "tablacus\\");
		if (api.PathMatchSpec(Path, root + "*")) {
			var ar = Path.replace(root, "").split("\\");
			var dwSessionId = parseInt(ar[0], 16);
			var cFV = te.Ctrls(CTRL_FV);
			for (var i in cFV) {
				var FV = cFV[i];
				if (FV.SessionId == dwSessionId) {
					var lib = Addons.WFX.GetObject(FV);
					if (lib) {
						lib.file = unescape(ar[1]);
						return lib;
					}
				}
			}
		}
	},

	Refresh: function (Ctrl)
	{
		Ctrl.Refresh();
	},

	StringToVerb: {
		"paste" : CommandID_PASTE,
		"delete": CommandID_DELETE,
		"copy": CommandID_COPY,
		"cut": CommandID_CUT,
		"properties": CommandID_PROPERTIES,
	},

	Command: function (Ctrl, Verb, ContextMenu)
	{
		if (Ctrl && Ctrl.Type <= CTRL_EB) {
			var lib = Addons.WFX.GetObject(Ctrl);
			if (lib) {
				switch (typeof(Verb) == "string" ? Addons.WFX.StringToVerb[Verb.toLowerCase()] : Verb + 1) {
					case CommandID_PASTE:
						Addons.WFX.Append(Ctrl, api.OleGetClipboard());
						return S_OK;
					case CommandID_DELETE:
						Addons.WFX.Delete(Ctrl);
						return S_OK;
					case CommandID_COPY:
					case CommandID_CUT:
						api.OleSetClipboard(Ctrl.SelectedItems());
						Addons.WFX.ClipId = api.sprintf(9, "%x", Ctrl.SessionId);
						Addons.WFX.ClipPath = lib.file;
						return S_OK;
					case CommandID_PROPERTIES:
						var Selected = Ctrl.SelectedItems();
						if (Selected.Count) {
							if (lib.X.FsExecuteFile) {
								lib.X.FsExecuteFile(te.hwnd, [fso.BuildPath(lib.path, unescape(fso.GetFileName(Selected.Item(0).Path)))], "properties")
								return S_OK;
							}
						}
						break;
				}
			}
		}
	},

	Append: function (Ctrl, Items)
	{
		if (!Items.Count) {
			return;
		}
		var lib = Addons.WFX.GetObject(Ctrl);
		if (lib && lib.X.FsPutFile) {
			Addons.WFX.Connect(lib);
			var pRefresh = [false];
			Addons.WFX.PutFiles(lib.X, Items, lib.path, pRefresh);
			if (pRefresh[0]) {
				Addons.WFX.Refresh(Ctrl);
			}
		}
	},

	PutFiles: function (WFX, Items, dest, pRefresh)
	{
		for (var i = 0; i < Items.Count; i++) {
			var Item = Items.Item(i);
			var path = Item.Path;
			var wfd = api.Memory("WIN32_FIND_DATA");
			api.SHGetDataFromIDList(Item, SHGDFIL_FINDDATA, wfd, wfd.Size);
			var fn = fso.BuildPath(dest, wfd.cFileName);
			if (wfd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) {
				if (WFX.FsMkDir && WFX.FsMkDir(fn)) {
					this.PutFiles(WFX, Item.GetFolder.Items(), fn, pRefresh);
					pRefresh[0] = true;
				}
				continue;
			}
			if (WFX.FsPutFile(path, fn, 1) == 0) {
				pRefresh[0] = true;
			}
		}
	},

	Delete: function (Ctrl)
	{
		var Items = Ctrl.SelectedItems();
		if (!Items.Count) {
			return;
		}
		var lib = Addons.WFX.GetObject(Ctrl.FolderItem.Path);
		if (lib) {
			Addons.WFX.Connect(lib);
			for (var i = 0; i < Items.Count; i++) {
				var wfd = api.Memory("WIN32_FIND_DATA");
				api.SHGetDataFromIDList(Items.Item(i), SHGDFIL_FINDDATA, wfd, wfd.Size);
				if (i == 0) {
					if (!lib.X.FsDeleteFile || !confirmOk("Are you sure?")) {
						return;
					}
				}
				var fn = fso.BuildPath(lib.path, unescape(wfd.cFileName));
				if (wfd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) {
					if (this.RemoveDir(lib.X, fn)) {
						bRefresh = true;
					}
				} else if (lib.X.FsDeleteFile(fn)) {
					bRefresh = true;
				}
			}
			if (bRefresh) {
				Ctrl.Refresh();
			}
		}
	},

	RemoveDir: function (WFX, path)
	{
		var wfd = {};
		var hFind = WFX.FsFindFirst(path, wfd);
		if (hFind != -1) {
			do {
				if (!api.PathMatchSpec(wfd.cFileName, ".;..")) {
					var fn = fso.BuildPath(path, wfd.cFileName);
					Addons.WFX.Unix2Win(wfd);
					if (wfd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) {
						this.RemoveDir(WFX, fn);
					} else if (WFX.FsDeleteFile) {
						WFX.FsDeleteFile(fn);
					}
				}
			} while (WFX.FsFindNext(hFind, wfd));
			WFX.FsFindClose(hFind);
		}
		return WFX.FsRemoveDir ? WFX.FsRemoveDir(path) : false;
	},

	Navigate: function (Ctrl)
	{
		var path = Ctrl.FolderItem.Path;
		var lib =  Addons.WFX.GetObject(path);
		if (lib) {
			Ctrl.SortColumn = "";
			clearTimeout(Addons.WFX.tid[Ctrl.Id]); 
			Addons.WFX.tid[Ctrl.Id] = setTimeout(function ()
			{
				delete Addons.WFX.tid[Ctrl.Id];
				Addons.WFX.Connect(lib);
				Ctrl.RemoveAll();
				Ctrl.NameFormat = 1;
				var root = fso.BuildPath(fso.GetSpecialFolder(2).Path, api.sprintf(99,"tablacus\\%x", Ctrl.SessionId));
				var wfd = {};
				var hFind = lib.X.FsFindFirst(lib.path, wfd);
				if (hFind != -1) {
					do {
						var fn = wfd.cFileName.replace(/([%\\/:\*\?"<>|]+)/g, function (all, re1)
						{
							return escape(re1);
						});
						if (!/^\.\.?$|^$/.test(fn)) {
							Addons.WFX.Unix2Win(wfd);
							Ctrl.AddItem(api.SHSimpleIDListFromPath(fso.BuildPath(root, fn), wfd.dwFileAttributes, wfd.ftLastWriteTime, api.QuadPart(wfd.nFileSizeLow, wfd.nFileSizeHigh)));
						}
					} while (lib.X.FsFindNext(hFind, wfd));
					lib.X.FsFindClose(hFind);
				}
			}, 500);
		}
	},

	CreateFolder: function (path)
	{
		var s = fso.GetParentFolderName(path);
		if (s.length > 3 && !fso.FolderExists(s)) {
			this.CreateFolder(s);
		}
		if (!fso.FolderExists(path)) {
			fso.CreateFolder(path);
		}
	},

	ChangeNotify: function (path)
	{
		var strMatch = path + ";" + path + "\\*";
		var cFV = te.Ctrls(CTRL_FV);
		for (var i in cFV) {
			var FV = cFV[i];
			if (FV.hwndView) {
				if (api.PathMatchSpec(api.GetDisplayNameOf(FV, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING), strMatch)) {
					if (Addons.WFX.tidNotify[FV.Id]) {
						clearTimeout(Addons.WFX.tidNotify[FV.Id]);
					}
					(function (FV) { Addons.WFX.tidNotify[FV.Id] = setTimeout(function () {
						delete Addons.WFX.tidNotify[FV.Id];
						FV.Refresh();
					}, 500);}) (FV);
				}
			}
		}
	},

	Connect: function (lib)
	{
		if (lib.X.FsDisconnect) {
			var re = /^\\([^\\]+)/.exec(lib.path);
			if (re) {
				Addons.WFX.Use[fso.BuildPath(lib.root, re[1])] = 1;
			}
		}
	},

	CheckDisconnect: function (Ctrl)
	{
		var bOk = true;
		for (var i in Addons.WFX.Use) {
			bOk = false;
			break;
		}
		if (bOk) {
			return;
		}
		if (Addons.WFX.tidClose) {
			clearTimeout(Addons.WFX.tidClose);
		}
		Addons.WFX.tidClose = setTimeout(function ()
		{
			var Use = {};
			var cFV = te.Ctrls(CTRL_FV);
			for (var i in cFV) {
				var FV = cFV[i];
				if (FV.hwndView) {
					var re = /^(\\{3}[^\\]+\\[^\\]+)/.exec(FV.FolderItem.Path);
					if (re) {
						Use[re[1]] = 1;
					}
				}
			}
			for (var i in Addons.WFX.Use) {
				if (!Use[i]) {
					var re = /^\\{3}([^\\]+)(.+)/.exec(i);
					if (re) {
						Addons.WFX.Obj[re[1]].X.FsDisconnect(re[2]);
					}
					delete Addons.WFX.Use[i];
				}
			}
		}, 999);
	},

	DefaultCommand: function (Ctrl, Selected)
	{
		if (Selected.Count) {
			var Item = Selected.Item(0);
			var path = api.GetDisplayNameOf(Item, SHGDN_FORPARSING | SHGDN_FORADDRESSBAR);
			if (Addons.WFX.IsHandle(path)) {
				Ctrl.Navigate(path);
				return S_OK;
			}
			var lib = Addons.WFX.GetObject(Ctrl);
			if (lib) {
				var path = fso.BuildPath(lib.path, unescape(Item.Name));
				if (IsFolderEx(Item)) {
					Ctrl.Navigate(fso.BuildPath(lib.root, path));
				} else {
					var pRemote = [path];
					var iRes = lib.X.FsExecuteFile && lib.X.FsExecuteFile(te.hwnd, pRemote, "open");
					if (iRes == 0) {
						return S_OK;
					}
					var wfd = {};
					var hFind = lib.X.FsFindFirst(pRemote[0], wfd);
					if (hFind != -1 && wfd.dwFileAttributes < 0) {
						while (api.PathMatchSpec(wfd.cFileName, ".;..") && lib.X.FsFindNext(hFind, wfd)) {
						}
						lib.X.FsFindClose(hFind);
						if (!api.PathMatchSpec(wfd.cFileName, ".;..")) {
							Ctrl.Navigate(fso.BuildPath(lib.root, pRemote[0]).replace(/\\$/, ""));
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

	ShowError: function (r, path)
	{
		var o = [0, 6327, 6146, 6175, 6173, 28743];
		MessageBox(api.LoadString(hShell32, o[r]) || api.sprintf(999, api.LoadString(hShell32, 4228), r), TITLE, MB_OK);
	},

	ProgressProc: function (PluginNr, SourceName, TargetName, PercentDone)
	{
		ShowStatusText(te, [SourceName, TargetName, PercentDone].join(" : "), 1);
		return 0;
	},

	LogProc: function (PluginNr, MsgType, LogString)
	{
		if (Addons.Debug) {
			Addons.Debug.alert(LogString);
		} else {
			api.OutputDebugString(LogString);
		}
	},

	RequestProc: function (PluginNr, RequestType, CustomTitle, CustomText, pReturnedText)
	{
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

	CryptProc: function (PluginNr, CryptoNumber, mode, ConnectionName, pPassword)
	{
		var db = te.Data.AddonsData.WFX[Addons.WFX.Root[PluginNr - 1]];
		if (!db) {
			db = {};
			te.Data.AddonsData.WFX[Addons.WFX.Root[PluginNr - 1]] = db;
		}
		switch (mode) {
			case 1://FS_CRYPT_SAVE_PASSWORD
				db[ConnectionName] = pPassword[0];
				return 0;
			case 2://FS_CRYPT_LOAD_PASSWORD
			case 3://FS_CRYPT_LOAD_PASSWORD_NO_UI
				pPassword[0] = db[ConnectionName];
				return pPassword[0] ? 0 : 3;
			case 4://FS_CRYPT_COPY_PASSWORD
				if (db[ConnectionName]) {
					db[pPassword[0]] = db[ConnectionName];
					return 0;
				}
				return 3;
			case 5://FS_CRYPT_MOVE_PASSWORD
				if (db[ConnectionName]) {
					db[pPassword[0]] = db[ConnectionName];
					delete db[ConnectionName];
					return 0;
				}
				return 3;
			case 6://FS_CRYPT_DELETE_PASSWORD
				if (db[ConnectionName]) {
					delete db[ConnectionName];
					return 0;
				}
				return 3;
		}
		return 6;
	},

	Unix2Win: function (wfd)
	{
		if (wfd.dwFileAttributes < 0) {
			if (wfd.dwReserved0 & 0x6000) {
				wfd.dwFileAttributes |= FILE_ATTRIBUTE_DIRECTORY;
			}
			if (!(wfd.dwReserved0 & 0x80)) {
				wfd.dwFileAttributes |= FILE_ATTRIBUTE_READONLY;
			}
		}
	},

	Properties: function (Ctrl)
	{
		var lib =  Addons.WFX.GetObject(Ctrl);
		if (lib && lib.X) {
			lib.X.FsExecuteFile(te.hwnd, ["\\"], "properties");
		}
	},

	ArrayProc: function ()
	{
		return [];
	},

	Finalize: function ()
	{
		for (var i in Addons.WFX.Use) {
			var re = /^\\{3}([^\\]+)(.+)/.exec(i);
			if (re) {
				Addons.WFX.Obj[re[1]].X.FsDisconnect(re[2]);
			}
			delete Addons.WFX.Use[i];
		}
		delete Addons.WFX.Obj;
		CollectGarbage();
		delete Addons.WFX.DLL;
	}
}
if (window.Addon == 1) {
	var twfxPath = fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), ["addons\\wfx\\twfx", api.sizeof("HANDLE") * 8, ".dll"].join(""));
	Addons.WFX.DLL = api.DllGetClassObject(twfxPath, "{5396F915-5592-451c-8811-87314FC0EF11}");

	AddEvent("Finalize", Addons.WFX.Finalize);

	AddEvent("TranslatePath", function (Ctrl, Path)
	{
		if (Addons.WFX.IsHandle(Path)) {
			return ssfRESULTSFOLDER;
		}
	}, true);

	AddEvent("ReplacePath", function (FolderItem, Path)
	{
		var lib = Addons.WFX.GetObjectEx(Path);
		if (lib) {
			return fso.BuildPath(lib.root, fso.BuildPath(lib.path, lib.file));
;
		}
	});

	AddEvent("NavigateComplete", Addons.WFX.Navigate);

	AddEvent("BeginDrag", function (Ctrl)
	{
		if (Addons.WFX.IsHandle(Ctrl)) {
			var pdwEffect = { 0: DROPEFFECT_COPY | DROPEFFECT_MOVE | DROPEFFECT_LINK };
			api.SHDoDragDrop(Ctrl.hwndView, Ctrl.SelectedItems(), Ctrl, pdwEffect[0], pdwEffect, true);
			return false;
		}
	});

	AddEvent("BeforeGetData", function (Ctrl, Items, nMode)
	{
		if (!Items.Count) {
			return;
		}
		var root = fso.BuildPath(fso.GetSpecialFolder(2).Path, "tablacus");
		var ar = [];
		for (var i = Items.Count; i-- ;) {
			var path = Items.Item(i).Path;
			if (api.PathMatchSpec(path, root + "*") && !IsExists(path)) {
				ar.unshift(Items.Item(i));
			}
		}
		if (!ar.length) {
			return;
		}
		var strSessionId = fso.GetParentFolderName(ar[0].Path).replace(root + "\\", "").replace(/\\.*/, "");
		var lib = Addons.WFX.GetObject(strSessionId == Addons.WFX.ClipId ? Addons.WFX.ClipPath : Ctrl);
		if (lib && lib.X.FsGetFile) {
			var root = fso.BuildPath(fso.GetSpecialFolder(2).Path, "tablacus\\" + strSessionId);
			Addons.WFX.CreateFolder(root);
			wsh.CurrentDirectory = root;

			for (var i in ar) {
				var item = ar[i];
				var wfd = api.Memory("WIN32_FIND_DATA");
				var hr = api.SHGetDataFromIDList(item, SHGDFIL_FINDDATA, wfd, wfd.Size);
				var fn = unescape(wfd.cFileName);
				var ri =
				{
					SizeLow: wfd.nFileSizeLow,
					SizeHigh: wfd.nFileSizeHigh,
					LastWriteTime: wfd.ftLastWriteTime,
					Attr: wfd.dwFileAttributes
				}
				lib.X.FsGetFile(fso.BuildPath(lib.path, fn), item.Path, 1, ri);
			}
			wsh.CurrentDirectory = fso.GetSpecialFolder(2).Path;
		}
	});

	AddEvent("Context", function (Ctrl, hMenu, nPos, Selected, item, ContextMenu)
	{
		var lib = Addons.WFX.GetObject(Ctrl);
		if (lib) {
			var ar = [];
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

	AddEvent("Background", function (Ctrl, hMenu, nPos, Selected, item, ContextMenu)
	{
		var lib = Addons.WFX.GetObject(Ctrl);
		if (lib) {
			api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, ++nPos, api.LoadString(hShell32, 33555));
			ExtraMenuCommand[nPos] = Addons.WFX.Properties;
		}
		return nPos;
	});

	AddEvent("Command", function (Ctrl, hwnd, msg, wParam, lParam)
	{
		var hr = Addons.WFX.Command(Ctrl, wParam & 0xfff);
		if (isFinite(hr)) {
			return hr;
		}
	}, true);

	AddEvent("InvokeCommand", function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon)
	{
		var hr = Addons.WFX.Command(ContextMenu.FolderView, Verb, ContextMenu);
		if (isFinite(hr)) {
			return hr;
		}
	}, true);

	AddEvent("DefaultCommand", Addons.WFX.DefaultCommand, true);

	AddEvent("ILGetParent", function (FolderItem)
	{
		var path = FolderItem.Path;
		var re = /^(\\{3})([^\\]*)(.*)/.exec(path);
		if (re) {
			if (!re[2]) {
				return ssfDESKTOP;
			}
			var lib = Addons.WFX.GetObject(path);
			if (lib) {
				return re[3] ? fso.BuildPath(lib.root, fso.GetParentFolderName(lib.path)) : re[1];
			}
		}
	});

	AddEvent("DragEnter", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		if (Ctrl.Type <= CTRL_EB || Ctrl.Type == CTRL_DT) {
			if (Addons.WFX.IsHandle(Ctrl)) {
				return S_OK;
			}
		}
	});

	AddEvent("DragOver", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		if (Ctrl.Type <= CTRL_EB || Ctrl.Type == CTRL_DT) {
			if (Addons.WFX.IsHandle(Ctrl)) {
				pdwEffect[0] = DROPEFFECT_COPY;
				return S_OK;
			}
		}
	});

	AddEvent("Drop", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		if (Addons.WFX.IsHandle(Ctrl)) {
			Addons.WFX.Append(Ctrl, dataObj);
			return S_OK;
		}
	});

	AddEvent("DragLeave", function (Ctrl)
	{
		return S_OK;
	});

	AddEvent("AddonDisabled", function (Id)
	{
		if (Id.toLowerCase() == "wfx") {
			Addons.WFX.Finalize();
		}
	});

	AddEvent("BeforeNavigate", function (Ctrl, fs, wFlags, Prev)
	{
		if (Ctrl.Type <= CTRL_EB && Addons.WFX.IsHandle(Prev)) {
			var root = fso.BuildPath(fso.GetSpecialFolder(2).Path, api.sprintf(99,"tablacus\\%x", Ctrl.SessionId));
			DeleteItem(root);
		}
	});

	AddEvent("BeginLabelEdit", function (Ctrl, Name)
	{
		if (Ctrl.Type <= CTRL_EB) {
			var lib = Addons.WFX.GetObject(Ctrl, lib);
			if (lib && !lib.X.FsRenMovFile) {
				return 1;
			}
		}
	});

	AddEvent("EndLabelEdit", function (Ctrl, Name)
	{
		if (Ctrl.Type <= CTRL_EB) {
			var lib = Addons.WFX.GetObject(Ctrl, lib);
			if (lib && lib.X.FsRenMovFile) {
				var Item = Ctrl.FocusedItem;
				if (Item) {
					var wfd = api.Memory("WIN32_FIND_DATA");
					api.SHGetDataFromIDList(Item, SHGDFIL_FINDDATA, wfd, wfd.Size);
					var fn = unescape(wfd.cFileName);
					if (fn != unescape(Name)) {
						fn = fso.BuildPath(lib.path, fn);
						var ri =
						{
							SizeLow: wfd.nFileSizeLow,
							SizeHigh: wfd.nFileSizeHigh,
							LastWriteTime: wfd.ftLastWriteTime,
							Attr: wfd.dwFileAttributes
						}
						if (ri.Attr & FILE_ATTRIBUTE_DIRECTORY) {
							ri.SizeLow = 0;
							ri.SizeHigh = 0xFFFFFFFF;
						}
						var r = lib.X.FsRenMovFile(fn, fso.BuildPath(lib.path, unescape(Name)), true, false, ri);
						setTimeout(function ()
						{
							if (r == 0) {
								Ctrl.Refresh();
							} else {
								Addons.WFX.ShowError(r, fn);
							}
						}, 99);
					}
				}
				return 1;
			}
		}
	}, true);

	AddEvent("CreateFolder", function (path)
	{
		var lib = Addons.WFX.GetObject(path);
		if (lib) {
			if (lib.X.FsMkDir && lib.X.FsMkDir(lib.path)) {
				Addons.WFX.ChangeNotify(fso.BuildPath(lib.root, fso.GetParentFolderName(lib.path)));
				return true;
			}
			MessageBox(api.LoadString(hShell32, 6461), TITLE, MB_ICONSTOP | MB_OK);
			return false;
		}
	}, true);

	AddEvent("CreateFile", function (path)
	{
		var lib = Addons.WFX.GetObject(path);
		if (lib) {
			if (lib.X.FsPutFile) {
				var sLocal = fso.BuildPath(fso.GetSpecialFolder(2).Path, api.sprintf(99,"tablacus\\n%x", Math.random() * MAXINT));
				fso.CreateTextFile(sLocal).Close();
				if (lib.X.FsPutFile(sLocal, lib.path, 0) == 0) {
					DeleteItem(sLocal);
					Addons.WFX.ChangeNotify(fso.BuildPath(lib.root, fso.GetParentFolderName(lib.path)));
					return true;
				}
				DeleteItem(sLocal);
			}
			MessageBox(api.LoadString(hShell32, 8728).replace(/%2!ls!/, lib.path).replace(/%1!ls!/, ""), TITLE, MB_ICONSTOP | MB_OK);
			return false;
		}
	}, true);

	AddEvent("SetFileTime", function (path, ctime, atime, mtime)
	{
		var lib = Addons.WFX.GetObjectEx(path);
		if (lib && lib.X.FsSetTime) {
			Addons.WFX.Connect(lib);
			if (lib.X.FsSetTime(fso.BuildPath(lib.path, lib.file), ctime, atime, mtime)) {
				Addons.WFX.ChangeNotify(fso.BuildPath(lib.root, lib.path));
				return true;
			}
			return false;
		}
	}, true);

	AddEvent("SetFileAttributes", function (path, attr)
	{
		var lib = Addons.WFX.GetObjectEx(path);
		if (lib && lib.X.FsSetAttr) {
			Addons.WFX.Connect(lib);
			if (lib.X.FsSetAttr(fso.BuildPath(lib.path, lib.file), attr)) {
				Addons.WFX.ChangeNotify(fso.BuildPath(lib.root, lib.path));
				return true;
			}
			return false;
		}
	}, true);

	AddEvent("ToolTip", function (Ctrl, Index)
	{
		if (Ctrl.Type <= CTRL_EB) {
			if (Addons.WFX.IsHandle(Ctrl)) {
				var Item = Ctrl.Items.Item(Index);
				if (Item.IsFolder) {
					var s = FormatDateTime(Item.ModifyDate);
					return s ? api.PSGetDisplayName("Write") + " : " + s : "";
				}
			}
		}
	});

	AddEvent("GetIconImage", function (Ctrl, BGColor)
	{
		if (document.documentMode) {
			var lib = Addons.WFX.GetObject(Ctrl);
			if (lib && lib.X.FsExtractCustomIcon) {
				var phIcon = [0];
				var r = lib.X.FsExtractCustomIcon(lib.path + "\\", 1, phIcon);
				if (r == 1 || r == 2) {
					var image = te.GdiplusBitmap();
					image.FromHICON(phIcon[0], BGColor);
					if (r == 2) {
						api.DestroyIcon(phIcon[0]);
					}
					return image.DataURI("image/png");
				}
			}
		}
	});

	AddEvent("CloseView", Addons.WFX.CheckDisconnect);
	AddEvent("ChangeView", Addons.WFX.CheckDisconnect);
}
