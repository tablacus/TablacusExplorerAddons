const Addon_Id = "wcx";
const item = GetAddonElement(Addon_Id);

Sync.WCX = {
	xml: OpenXml("wcx.xml", false, true),

	IsHandle: function (Ctrl) {
		return Sync.WCX.GetObject(Ctrl) != null;
	},

	GetObject: function (Ctrl) {
		if (!Sync.WCX.DLL) {
			return;
		}
		const lib = {
			file: "string" === typeof Ctrl ? Ctrl : api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL),
			path: ""
		}
		if (!Sync.WCX.Obj) {
			Sync.WCX.Init();
		}
		let nDog = 32;
		while (/^[A-Z]:\\|^\\\\[A-Z]/i.test(lib.file) && nDog--) {
			for (let i in Sync.WCX.Obj) {
				const item = Sync.WCX.Obj[i];
				if (api.PathMatchSpec(lib.file, item.filter)) {
					if (item.X.CanYouHandleThisFile(lib.file)) {
						lib.X = item.X;
						return lib;
					}
				}
			}
			lib.path = BuildPath(GetFileName(lib.file), lib.path);
			lib.file = GetParentFolderName(lib.file);
		}
	},

	Init: function () {
		Sync.WCX.Obj = [];
		const items = Sync.WCX.xml.getElementsByTagName("Item");
		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			const filter = item.getAttribute("Filter");
			const dllPath = (ExtractMacro(te, api.PathUnquoteSpaces(item.getAttribute("Path"))) + (api.sizeof("HANDLE") > 4 ? "64" : "")).replace(/\.u(wcx64)$/, ".$1");
			const WCX = Sync.WCX.DLL.Open(dllPath);
			if (WCX && WCX.OpenArchive) {
				Sync.WCX.Obj.push({ X: WCX, filter: filter });
				WCX.PackSetDefaultParams(BuildPath(te.Data.DataFolder, "config\\pkplugin.ini"));
				WCX.SetChangeVolProc(-1, Sync.WCX.ChangeVolProc);
				WCX.SetProcessDataProc(-1, Sync.WCX.ProcessDataProc);
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

	Command: function (Ctrl, Verb) {
		if (Ctrl && Ctrl.Type <= CTRL_EB && Sync.WCX.IsHandle(Ctrl)) {
			switch ("string" === typeof Verb ? Sync.WCX.StringToVerb[Verb.toLowerCase()] : Verb + 1) {
				case CommandID_PASTE:
					Sync.WCX.Append(Ctrl, api.OleGetClipboard());
					return S_OK;
				case CommandID_DELETE:
					Sync.WCX.Delete(Ctrl);
					return S_OK;
				case CommandID_COPY:
				case CommandID_CUT:
					const lib = Sync.WCX.GetObject(Ctrl);
					if (lib) {
						api.OleSetClipboard(Ctrl.SelectedItems());
						Sync.WCX.ClipId = api.sprintf(9, "%x", Ctrl.SessionId);
						Sync.WCX.ClipPath = lib.file;
						return S_OK;
					}
			}
		}
	},

	LocalList: function (Items, fl, nLevel) {
		for (let i = 0; i < Items.Count; i++) {
			if (Sync.WCX.Progress.HasUserCancelled()) {
				return 1;
			}
			const Item = Items.Item(i);
			if (IsFolderEx(Item)) {
				if (this.LocalList(Item.GetFolder.Items(), fl, nLevel + 1)) {
					return 1;
				}
				continue;
			}
			fl.push(Item.Path.split(/\\/).slice(-nLevel).join("\\"));
			Sync.WCX.SizeTotal += Item.ExtendedProperty("size");
		}
		return 0;
	},

	ArcList: function (lib, fh, sh) {
		const OpenData = {
			ArcName: lib.file,
			OpenMode: 0
		}
		const harc = lib.X.OpenArchive(OpenData);
		if (harc) {
			const nlp = lib.path ? lib.path.split(/\\/).length : 0;
			do {
				if (Sync.WCX.Progress.HasUserCancelled()) {
					return 1;
				}
				const info = {};
				if (lib.X.ReadHeaderEx(harc, info)) {
					break;
				}
				const fn = info.FileName.replace(/\//g, "\\");;
				if (!/\.\.\\|:/.test(fn)) {
					const ar = fn.split(/\\/);
					if (api.StrCmpI(ar.slice(0, nlp).join("\\"), lib.path) == 0) {
						const fn1 = String(ar[nlp]).toLowerCase();
						if (!fh[fn1]) {
							fh[fn1] = [];
							sh[fn1] = 0;
						}
						fh[fn1].push(fn);
						sh[fn1] += api.QuadPart(info.UnpSize, info.UnpSizeHigh);
					}
				}
			} while (lib.X.ProcessFile(harc, 0) == 0);
			lib.X.CloseArchive(harc);
		}
		return 0;
	},

	Append: function (Ctrl, Items) {
		if (!Items.Count) {
			return;
		}
		const lib = Sync.WCX.GetObject(Ctrl);
		if (lib && lib.X.PackFiles) {
			const fl = [];
			const root = Items.Item(-1).Path;
			Sync.WCX.SizeCurrent = 0;
			Sync.WCX.SizeTotal = 0;
			Sync.WCX.Progress = api.CreateObject("ProgressDialog");
			Sync.WCX.Progress.StartProgressDialog(te.hwnd, null, 2);
			try {
				Sync.WCX.Progress.SetLine(1, api.LoadString(hShell32, 33260) || api.LoadString(hShell32, 6478), true);
				if (!Sync.WCX.LocalList(Items, fl, 1)) {
					Sync.WCX.ShowLine(5954, 32946, fl.length);
					fl.push("");
					if (lib.X.PackFiles(lib.file, lib.path, root + "\\", fl.join("\0"), 0) == 0) {
						Sync.WCX.Refresh(Ctrl);
					}
				}
			} catch (e) { }
			Sync.WCX.Progress.StopProgressDialog();
			delete Sync.WCX.Progress;
		}
	},

	Delete: function (Ctrl) {
		const Items = Ctrl.SelectedItems();
		if (!Items.Count || !confirmOk()) {
			return;
		}
		const lib = Sync.WCX.GetObject(Ctrl.FolderItem.Path);
		if (lib && lib.X.DeleteFiles) {
			const fl = [], fh = {}, sh = {};
			Sync.WCX.SizeCurrent = 0;
			Sync.WCX.SizeTotal = 0;
			Sync.WCX.Progress = api.CreateObject("ProgressDialog");
			Sync.WCX.Progress.StartProgressDialog(te.hwnd, null, 2);
			try {
				Sync.WCX.Progress.SetLine(1, api.LoadString(hShell32, 33269) || api.LoadString(hShell32, 6478), true);
				Sync.WCX.ArcList(lib, fh, sh);
				for (let i = 0; i < Items.Count; i++) {
					const Item = Items.Item(i);
					const fn = GetFileName(Item.Path).toLowerCase();
					const o = fh[fn];
					for (let j in o) {
						fl.push(o[j]);
					}
					Sync.WCX.SizeTotal += sh[fn];
				}
				Sync.WCX.ShowLine(5955, 32947, fl.length);
				fl.push("");
				if (lib.X.DeleteFiles(lib.file, fl.join("\0")) == 0) {
					Sync.WCX.Refresh(Ctrl);
				}
			} catch (e) { }
			Sync.WCX.Progress.StopProgressDialog();
			delete Sync.WCX.Progress;
		}
	},

	Enum: function (pid, Ctrl, fncb) {
		const lib = Sync.WCX.GetObject(pid.Path);
		if (Ctrl && lib) {
			const Items = api.CreateObject("FolderItems");
			const root = BuildPath(fso.GetSpecialFolder(2).Path, api.sprintf(99, "tablacus\\%x", Ctrl.SessionId));
			const OpenData = {
				ArcName: lib.file,
				OpenMode: 0
			}
			const harc = lib.X.OpenArchive(OpenData);
			if (harc) {
				const Folder = {}, Folder2 = {};
				do {
					const info = {};
					if (lib.X.ReadHeaderEx(harc, info)) {
						break;
					}
					let fn = info.FileName.replace(/\//g, "\\");
					if (/\.\.\\|:/.test(fn)) {
						continue;
					}
					const strParent = GetParentFolderName(fn).toLowerCase();
					if (strParent == lib.path.toLowerCase()) {
						if (info.FileAttr & FILE_ATTRIBUTE_DIRECTORY) {
							Folder[fn.replace(/\\$/, "")] = 1;
						}
						Items.AddItem(api.SHSimpleIDListFromPath(BuildPath(root, fn), info.FileAttr, info.FileTime, info.UnpSize));
					}
					while (/[\\|\/]/.test(fn)) {
						fn = GetParentFolderName(fn);
						if (!fn) {
							break;
						}
						Folder2[fn] = 1;
					}
				} while (lib.X.ProcessFile(harc, 0) == 0);
				lib.X.CloseArchive(harc);
				for (fn in Folder2) {
					if (!Folder[fn]) {
						const strParent = GetParentFolderName(fn).toLowerCase();
						if (strParent == lib.path.toLowerCase()) {
							const pidl = api.SHSimpleIDListFromPath(BuildPath(root, fn), FILE_ATTRIBUTE_DIRECTORY, new Date(), 0);
							Items.AddItem(pidl);
						}
					}
				}
			}
			return Items;
		}
	},

	CreateFolder: function (path) {
		const s = GetParentFolderName(path);
		if (s.length > 3 && !fso.FolderExists(s)) {
			this.CreateFolder(s);
		}
		if (!fso.FolderExists(path)) {
			try {
				fso.CreateFolder(path);
			} catch (e) { }
		}
	},

	ShowLine: function (s1, s2, i) {
		let s3 = 6466;
		if (g_.IEVer > 8) {
			s3 = i > 1 ? 38192 : 38193;
			if (i > 999) {
				i = i.toLocaleString();
			}
		}
		this.Progress.SetLine(1, [api.LoadString(hShell32, s1) || api.LoadString(hShell32, s2), " ", (api.LoadString(hShell32, s3) || "%s items").replace(/%1!ls!|%s/g, i), " (", api.StrFormatByteSize(Sync.WCX.SizeTotal), ")"].join(""), true);
		this.Progress.Timer(1);
	},

	ChangeVolProc: function (ArcName, Mode) {
		let r = 1;
		if (Mode) {
			MessageBox(GetText("Change Volume") + "?\n\n" + ArcName, TITLE, MB_OK);
		} else {
			r = confirmOk(GetText("Change Volume") + "\n\n" + ArcName, TITLE) ? 1 : 0;
		}
		return r;
	},

	ProcessDataProc: function (FileName, Size) {
		if (Sync.WCX.Progress) {
			let points = 0;
			if (Size >= 0) {
				Sync.WCX.SizeCurrent += Size;
				points = Math.min(Math.floor(Sync.WCX.SizeCurrent * 100 / Sync.WCX.SizeTotal), 100);
			} else if (Size >= -100) {
				points = Math.abs(Size);
			}
			if (FileName && Sync.WCX.StartProgress) {
				Sync.WCX.StartProgress = false;
				Sync.WCX.Progress.StartProgressDialog(te.hwnd, null, 2);
			}
			Sync.WCX.Progress.SetTitle(points + "%");
			Sync.WCX.Progress.SetProgress(points, 100);
			Sync.WCX.Progress.SetLine(2, (FileName || "").replace(Sync.WCX.RootPath, ""), true);
			return Sync.WCX.Progress.HasUserCancelled() ? 0 : 1;
		}
		return 1;
	},

	Finalize: function () {
		delete Sync.WCX.Obj;
		CollectGarbage();
		delete Sync.WCX.DLL;
	}
}

const twcxPath = BuildPath(GetParentFolderName(api.GetModuleFileName(null)), ["addons\\wcx\\twcx", api.sizeof("HANDLE") * 8, ".dll"].join(""));
Sync.WCX.DLL = api.DllGetClassObject(twcxPath, "{56297D71-E778-4dfd-8678-6F4079A2BC50}");

AddEvent("Finalize", Sync.WCX.Finalize);

AddEvent("TranslatePath", function (Ctrl, Path) {
	if (Sync.WCX.IsHandle(Path)) {
		Ctrl.Enum = Sync.WCX.Enum;
		return ssfRESULTSFOLDER;
	}
}, true);

AddEvent("BeginDrag", function (Ctrl) {
	if (Sync.WCX.IsHandle(Ctrl)) {
		const pdwEffect = [DROPEFFECT_COPY | DROPEFFECT_MOVE | DROPEFFECT_LINK];
		api.SHDoDragDrop(Ctrl.hwndView, Ctrl.SelectedItems(), Ctrl, pdwEffect[0], pdwEffect, true);
		return false;
	}
});

AddEvent("BeforeGetData", function (Ctrl, Items, nMode) {
	if (!Items.Count) {
		return;
	}
	let hr = S_OK;
	const root = BuildPath(fso.GetSpecialFolder(2).Path, "tablacus");
	const ar = [];
	for (let i = Items.Count; i--;) {
		const path = Items.Item(i).Path;
		if (!api.StrCmpNI(root, path, root.length) && !fso.FileExists(path)) {
			ar.unshift(GetFileName(path).toLowerCase());
		}
	}
	if (!ar.length) {
		return;
	}
	const strSessionId = GetParentFolderName(ar[0]).replace(root + "\\", "").replace(/\\.*/, "");
	dir = {};
	const lib = Sync.WCX.GetObject(strSessionId == Sync.WCX.ClipId ? Sync.WCX.ClipPath : Ctrl);
	if (lib) {
		Sync.WCX.SizeCurrent = 0;
		Sync.WCX.SizeTotal = 0;
		Sync.WCX.Progress = api.CreateObject("ProgressDialog");
		Sync.WCX.StartProgress = true;
		try {
			Sync.WCX.Progress.SetLine(1, api.LoadString(hShell32, 33260) || api.LoadString(hShell32, 6478), true);
			const o = {};
			const root = BuildPath(fso.GetSpecialFolder(2).Path, api.sprintf(99, "tablacus\\%x", Ctrl.SessionId));
			Sync.WCX.RootPath = root + "\\";
			const fh = {}, sh = {}, fl = [];
			Sync.WCX.ArcList(lib, fh, sh);
			for (let i in ar) {
				const fh1 = fh[ar[i]];
				for (let j in fh1) {
					fl.push(fh1[j]);
				}
				Sync.WCX.SizeTotal += sh[ar[i]];
			}
			for (let i = fl.length; i--;) {
				o[fl[i]] = 2;
			}
			Sync.WCX.CreateFolder(root);
			wsh.CurrentDirectory = root;
			const OpenData = {
				ArcName: lib.file,
				OpenMode: 1
			}
			Sync.WCX.ShowLine(5954, 32946, fl.length);
			const harc = lib.X.OpenArchive(OpenData);
			if (harc) {
				let op;
				do {
					let dest = null;
					const info = [];
					if (lib.X.ReadHeaderEx(harc, info)) {
						break;
					}
					const fn = info.FileName.replace(/\//g, "\\");
					if (/\.\.\\|:/.test(fn)) {
						op = 0;
						continue;
					}
					op = o[fn];
					if (op) {
						dest = BuildPath(root, fn);
						if (info.FileAttr & FILE_ATTRIBUTE_DIRECTORY) {
							op = 0;
						} else {
							Sync.WCX.CreateFolder(GetParentFolderName(dest));
						}
					}
				} while (lib.X.ProcessFile(harc, op, null, dest) == 0 && !Sync.WCX.Progress.HasUserCancelled());
				lib.X.CloseArchive(harc);
			}
			wsh.CurrentDirectory = fso.GetSpecialFolder(2).Path;
		} catch (e) {
			ShowError(e, "WCX");
		}
		Sync.WCX.Progress.StopProgressDialog();
		if (Sync.WCX.Progress.HasUserCancelled()) {
			hr = E_ABORT;
		}
		delete Sync.WCX.Progress;
		delete Sync.WCX.SizeCurrent;
	}
	return hr;
});

AddEvent("Command", function (Ctrl, hwnd, msg, wParam, lParam) {
	return Sync.WCX.Command(Ctrl, wParam & 0xfff);
}, true);

AddEvent("InvokeCommand", function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon) {
	return Sync.WCX.Command(ContextMenu.FolderView, Verb);
}, true);

AddEvent("DefaultCommand", function (Ctrl, Selected) {
	if (Selected.Count == 1) {
		let path = api.GetDisplayNameOf(Selected.Item(0), SHGDN_FORPARSING | SHGDN_FORADDRESSBAR | SHGDN_ORIGINAL);
		if (Sync.WCX.IsHandle(path)) {
			Ctrl.Navigate(path);
			return S_OK;
		}
		if (Selected.Item(0).IsFolder) {
			const lib = Sync.WCX.GetObject(Ctrl);
			if (lib) {
				const root = BuildPath(fso.GetSpecialFolder(2).Path, api.sprintf(99, "tablacus\\%x", Ctrl.SessionId));
				path = path.replace(root, lib.file);
				Ctrl.Navigate(path);
				return S_OK;
			}
		}
	}
}, true);

AddEvent("ILGetParent", function (FolderItem) {
	if (Sync.WCX.IsHandle(FolderItem)) {
		return GetParentFolderName(FolderItem.Path);
	}
});

AddEvent("Context", function (Ctrl, hMenu, nPos, Selected, item, ContextMenu) {
	const path = api.GetDisplayNameOf(Ctrl.FolderItem, SHGDN_FORPARSING | SHGDN_FORADDRESSBAR | SHGDN_ORIGINAL);
	if (Sync.WCX.IsHandle(path)) {
		RemoveCommand(hMenu, ContextMenu, "rename");
	}
	return nPos;
});

AddEvent("DragEnter", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
	if (Ctrl.Type <= CTRL_EB || Ctrl.Type == CTRL_DT) {
		if (Sync.WCX.IsHandle(Ctrl)) {
			return S_OK;
		}
	}
});

AddEvent("DragOver", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
	if (Ctrl.Type <= CTRL_EB || Ctrl.Type == CTRL_DT) {
		const lib = Sync.WCX.GetObject(Ctrl);
		if (lib) {
			pdwEffect[0] = lib.X.PackFiles ? DROPEFFECT_COPY : DROPEFFECT_NONE;
			return S_OK;
		}
	}
});

AddEvent("Drop", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
	if (Sync.WCX.IsHandle(Ctrl)) {
		Sync.WCX.Append(Ctrl, dataObj);
		return S_OK;
	}
});

AddEvent("DragLeave", function (Ctrl) {
	return S_OK;
});

AddEvent("AddonDisabled", function (Id) {
	if (Id.toLowerCase() == "wcx") {
		Sync.WCX.Finalize();
	}
});

AddEvent("BeforeNavigate", function (Ctrl, fs, wFlags, Prev) {
	if (Ctrl.Type <= CTRL_EB && Sync.WCX.IsHandle(Prev)) {
		const root = BuildPath(fso.GetSpecialFolder(2).Path, api.sprintf(99, "tablacus\\%x", Ctrl.SessionId));
		DeleteItem(root);
	}
});

AddEvent("BeginLabelEdit", function (Ctrl, Name) {
	if (Ctrl.Type <= CTRL_EB) {
		if (Sync.WCX.IsHandle(Ctrl)) {
			return 1;
		}
	}
});

AddEvent("ToolTip", function (Ctrl, Index) {
	if (Ctrl.Type <= CTRL_EB) {
		if (Sync.WCX.IsHandle(Ctrl)) {
			const Item = Ctrl.Items.Item(Index);
			if (Item.IsFolder) {
				const s = FormatDateTime(Item.ModifyDate);
				return s ? api.PSGetDisplayName("Write") + " : " + s : "";
			}
		}
	}
}, true);
