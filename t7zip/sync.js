const Addon_Id = "t7zip";
const item = GetAddonElement(Addon_Id);

Sync.T7Zip = {
	DLL: api.DllGetClassObject(BuildPath(GetParentFolderName(api.GetModuleFileName(null)), ["addons\\t7zip\\t7z", api.sizeof("HANDLE") * 8, ".dll"].join("")), "{BFD084CA-C9AA-4bd3-9984-D5ED699A0711}"),

	Cmd: {},
	Mode: { Extract: 1, Add: 2, Delete: 3 },

	IsHandle: function (Ctrl, need) {
		return Sync.T7Zip.GetObject(Ctrl, need) != null;
	},

	GetObject: function (Ctrl, need) {
		if (!Sync.T7Zip.DLL || Sync.T7Zip.Cmd[need] === "-") {
			return;
		}
		let lib = {
			file: "string" === typeof Ctrl ? Ctrl : api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL),
			path: ""
		}
		for (let nDog = 32; /^[A-Z]:\\|^\\\\[A-Z]/i.test(lib.file) && nDog--;) {
			if (Sync.T7Zip.DLL.IsSupported(lib.file, Sync.T7Zip.Mode[need])) {
				return lib;
			}
			lib.path = BuildPath(fso.GetFileName(lib.file), lib.path);
			lib.file = GetParentFolderName(lib.file);
		}
	},

	Exec: function (Ctrl, lib, strCmd, strPath, arList, bRefresh) {
		strCmd = strCmd.replace(/%archive%/i, api.PathQuoteSpaces(lib.file));
		strCmd = strCmd.replace(/%items%/i, arList.join(" "));
		if (!/^[A-Z]:\\|^\\\\[A-Z]/i.test(strPath)) {
			strPath = null;
		}
		let r = api.CreateProcess(Sync.T7Zip.Exe + ' ' + strCmd, strPath, 0, 0, 0, true);
		Sync.T7Zip.Debug([Sync.T7Zip.Exe, strCmd, "(CD:" + (strPath || "").replace(fso.GetSpecialFolder(2).Path, "%TEMP%"), ')'].join(" "));
		if ("number" === typeof r) {
			setTimeout(function () {
				MessageBox([api.sprintf(99, "Error: %d", r), Sync.T7Zip.Exe, strCmd].join("\n").replace(/^\s*/, ""), TITLE, MB_ICONSTOP);
			}, 99);
		} else {
			let bWait;
			do {
				bWait = false;
				WmiProcess("WHERE ProcessId=" + r.ProcessId, function (item) {
					bWait = true;
					api.Sleep(500);
				});
			} while (bWait);
			if (bRefresh) {
				Ctrl.Refresh();
			}
		}
	},

	StringToVerb: {
		"paste": CommandID_PASTE,
		"delete": CommandID_DELETE,
		"copy": CommandID_COPY,
		"cut": CommandID_CUT,
		"properties": CommandID_PROPERTIES,
	},

	Command: function (Ctrl, Verb) {
		if (Ctrl && Ctrl.Type <= CTRL_EB) {
			switch ("string" === typeof Verb ? Sync.T7Zip.StringToVerb[Verb.toLowerCase()] : Verb + 1) {
				case CommandID_PASTE:
					if (Sync.T7Zip.Append(Ctrl, api.OleGetClipboard())) {
						return S_OK;
					}
					break;
				case CommandID_DELETE:
					if (Sync.T7Zip.Delete(Ctrl)) {
						return S_OK;
					}
					break;
				case CommandID_COPY:
				case CommandID_CUT:
					let lib = Sync.T7Zip.GetObject(Ctrl, "Extract");
					if (lib) {
						api.OleSetClipboard(Ctrl.SelectedItems());
						Sync.T7Zip.ClipId = api.sprintf(9, "%x", Ctrl.SessionId);
						Sync.T7Zip.ClipPath = lib.file;
						return S_OK;
					}
					break;
			}
		}
	},

	Append: function (Ctrl, Items) {
		if (!Items.Count) {
			return;
		}
		let lib = Sync.T7Zip.GetObject(Ctrl, "Add");
		if (lib) {
			let ar = [], root;
			if (lib.path) {
				let root = BuildPath(fso.GetSpecialFolder(2).Path, api.sprintf(99, "tablacus\\%x", Ctrl.SessionId));
				let path = BuildPath(root, lib.path);
				DeleteItem(path);
				Sync.T7Zip.CreateFolder(path);
				let oDest = sha.NameSpace(path);
				if (oDest) {
					oDest.CopyHere(Items, FOF_NOCONFIRMATION | FOF_NOCONFIRMMKDIR);
					ar.push(lib.path);
				}
			} else {
				let root = Items.Item(-1).Path;
				if (!/^[A-Z]:\\|^\\\\[A-Z]/i.test(root)) {
					root = GetParentFolderName(Items.Item(0).Path);
				}
				for (let i = Items.Count; i-- > 0;) {
					let Item = Items.Item(i);
					ar.unshift(api.PathQuoteSpaces(Item.Path.replace(root, "").replace(/^\\/, "")));
				}
			}
			Sync.T7Zip.Exec(Ctrl, lib, Sync.T7Zip.Cmd.Add, root, ar, true);
			return true;
		}
	},

	Delete: function (Ctrl) {
		let Items = Ctrl.SelectedItems();
		if (!Items.Count) {
			return;
		}
		let lib = Sync.T7Zip.GetObject(Ctrl, "Delete");
		if (lib) {
			if (!confirmOk()) {
				return;
			}
			let root = BuildPath(fso.GetSpecialFolder(2).Path, api.sprintf(99, "tablacus\\%x", Ctrl.SessionId));
			let ar = [];
			for (let i = Items.Count; i-- > 0;) {
				ar.unshift(api.PathQuoteSpaces(Items.Item(i).Path.replace(root, "").replace(/^\\/, "")));
			}
			Sync.T7Zip.Exec(Ctrl, lib, Sync.T7Zip.Cmd.Delete, fso.GetSpecialFolder(2).Path, ar, true);
			return true;
		}
	},

	Enum: function (pid, Ctrl, fncb, SessionId) {
		let lib = Sync.T7Zip.GetObject(pid.Path);
		if (lib) {
			let q = {
				Items: api.CreateObject("FolderItems"),
				Path: lib.file,
				Folder: {},
				Folder2: {},
				lib: lib,
				root: BuildPath(fso.GetSpecialFolder(2).Path, api.sprintf(99, "tablacus\\%x", SessionId)),
				GetProperty: Sync.T7Zip.GetProperty,
				GetPassword: Sync.T7Zip.GetPassword
			}
			Sync.T7Zip.DLL.GetArchiveInfo(q);
			for (let fn in q.Folder2) {
				if (!q.Folder[fn]) {
					if (SameText(GetParentFolderName(fn), lib.path)) {
						q.Items.AddItem(api.SHSimpleIDListFromPath(BuildPath(q.root, fn), FILE_ATTRIBUTE_DIRECTORY, new Date(), 0));
					}
				}
			}
			return q.Items;
		}
	},

	GetProperty: function (q, Path, IsDir, Size, MTime) {
		let fn = Path.replace(/\//g, "\\");
		if (SameText(GetParentFolderName(fn), q.lib.path)) {
			let dwAttr = 0;
			if (IsDir) {
				dwAttr = FILE_ATTRIBUTE_DIRECTORY;
				q.Folder[fn] = 1;
			}
			q.Items.AddItem(api.SHSimpleIDListFromPath(BuildPath(q.root, fn), dwAttr, MTime, Size));
		}
		while (/\\/.test(fn)) {
			fn = GetParentFolderName(fn);
			if (!fn) {
				break;
			}
			q.Folder2[fn] = 1;
		}

	},

	GetPassword: function (q) {
		return InputDialog("Password", "");
	},

	CreateFolder: function (path) {
		let s = GetParentFolderName(path);
		if (s.length > 3 && !fso.FolderExists(s)) {
			this.CreateFolder(s);
		}
		if (!fso.FolderExists(path)) {
			fso.CreateFolder(path);
		}
	},

	GetDropEffect: function (Ctrl, dataObj, pdwEffect) {
		pdwEffect[0] = DROPEFFECT_NONE;
		if (dataObj.Count) {
			if (!api.PathMatchSpec(dataObj.Item(0).Path, BuildPath(fso.GetSpecialFolder(2).Path, api.sprintf(99, "tablacus\\%x\\*", Ctrl.SessionId)))) {
				pdwEffect[0] = DROPEFFECT_COPY;
				return true;
			}
		}
	},

	Init: function ()
	{
		if (Sync.T7Zip.DLL) {
			let bit = api.sizeof("HANDLE") * 8;
			let strDll = api.PathUnquoteSpaces(ExtractMacro(te, item.getAttribute("Dll" + bit)));
			if (!strDll || !Sync.T7Zip.DLL.Init(strDll)) {
				if (!Sync.T7Zip.DLL.Init("C:\\Program Files\\7-Zip\\7z.dll")) {
					if (!Sync.T7Zip.DLL.Init("C:\\Program Files (x86)\\7-Zip\\7z.dll")) {
						return;
					}
				}
			}
			let strExe = api.PathUnquoteSpaces(ExtractMacro(te, item.getAttribute("Exe" + bit)));
			if (!strExe || !fso.FileExists(strExe)) {
				strExe = Sync.T7Zip.DLL.Path.replace(/7z\.dll$/i, "7zG.exe");
				if (!fso.FileExists(strExe)) {
					strExe = 'C:\\Program Files\\7-Zip\\7zG.exe';
				}
			}
			Sync.T7Zip.Exe = api.PathQuoteSpaces(strExe);
			let q = { List: {}, Update: {} };
			Sync.T7Zip.DLL.GetHandlerProperty2(q, function (q, Name, ClassID, Extension, AddExtension, Update, KeepName, Signature, MultiSignature, SignatureOffset, AltStreams, NtSecure, Flags) {
				let ext = Extension.split(/\s/);
				for (let s in ext) {
					q.List[ext[s]] = 1;
					if (Update) {
						q.Update[ext[s]] = 1;
					}
				}
			});
			let ar = [];
			for (let s in q.List) {
				ar.push("*." + s);
			}
			Sync.T7Zip.DLL.FilterList = item.getAttribute("FilterList") || ar.join(";") || "*.7z;*.zip";
			Sync.T7Zip.DLL.DisableList = item.getAttribute("DisableList") || "*.chm;*.doc;*.docx;*.epub;*.exe;*.msi;*.ods;*.odt;*.ppt;*.xls;*.xlsx;*.zip";

			Sync.T7Zip.DLL.FilterExtract = item.getAttribute("FilterExtract") || ar.join(";") || "*.7z;*.zip";
			Sync.T7Zip.DLL.DisableExtract = item.getAttribute("DisableExtract") || "*.zip";
			ar.length = 0;
			for (let s in q.Update) {
				ar.push("*." + s);
			}
			Sync.T7Zip.DLL.FilterUpdate = item.getAttribute("FilterUpdate") || ar.join(";") || "-";
			Sync.T7Zip.DLL.DisableUpdate = item.getAttribute("DisableUpdate") || "*.zip";

			Sync.T7Zip.DLL.FilterContent = item.getAttribute("FilterContent") || "*";
			Sync.T7Zip.DLL.DisableContent = item.getAttribute("DisableContent") || "-";

			Sync.T7Zip.DLL.FilterPreview = item.getAttribute("FilterPreview") || "*";
			Sync.T7Zip.DLL.DisablePreview = item.getAttribute("DisablePreview") || "-";

			Sync.T7Zip.DLL.IsContent = !GetNum(item.getAttribute("NoContent"));

			Sync.T7Zip.Cmd.Extract = (item.getAttribute("CmdExtract") || 'x') + ' %archive% %items%';
			Sync.T7Zip.Cmd.Add = (item.getAttribute("CmdAdd") || 'a') + ' %archive% %items%';
			Sync.T7Zip.Cmd.Delete = (item.getAttribute("CmdDelete") || 'd') + ' %archive% %items%';

			Sync.T7Zip.DLL.hwnd = te.hwnd;
			if  (!GetNum(item.getAttribute("NoExSort"))) {
				AddEvent("ColumnClick", function (Ctrl, iItem) {
					if (Ctrl.Type <= CTRL_EB) {
						if (Sync.T7Zip.IsHandle(Ctrl)) {
							let cColumns = api.CommandLineToArgv(Ctrl.Columns(1));
							let s = cColumns[iItem * 2];
							if (api.PathMatchSpec(s, "System.ItemNameDisplay;System.DateModified")) {
								let s1 = Ctrl.SortColumns;
								let s2 = 'prop:' + s + ';System.ItemTypeText;';
								let s3 = s2.replace(":", ":-");
								if (s1 != s2 && s1 != s3) {
									Ctrl.SortColumns = (s1 == s2) ? s3 : s2;
									return S_OK;
								}
							}
						}
					}
				});

				AddEvent("Sort", function (Ctrl) {
					if (Ctrl.Type <= CTRL_EB) {
						if (Sync.T7Zip.IsHandle(Ctrl)) {
							let s1 = Ctrl.SortColumns;
							if (/^prop:\-?System\.ItemNameDisplay;$|^prop:\-?System\.DateModified;$/.test(s1)) {
								setTimeout(function () {
									Ctrl.SortColumns = s1 + 'System.ItemTypeText;';
								}, 99);
							}
						}
					}
				});
			}

			te.AddEvent("GetImage", Sync.T7Zip.DLL.GetImage(api.GetProcAddress(null, "GetImage")));
			te.AddEvent("GetArchive", Sync.T7Zip.DLL.GetArchive);
			return true;
		}
	},

	IsFolder: function (Item) {
		let wfd = api.Memory("WIN32_FIND_DATA");
		api.SHGetDataFromIDList(Item, SHGDFIL_FINDDATA, wfd, wfd.Size);
		return wfd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY;
	},

	Debug: function (s) {
		if (Sync.Debug) {
			Sync.Debug.alert(s);
		} else {
			api.OutputDebugString(s + "\n");
		}
	},

	Finalize: function () {
		if (Sync.T7Zip.DLL) {
			te.RemoveEvent("GetArchive", Sync.T7Zip.DLL.GetArchive);
			te.RemoveEvent("GetImage", Sync.T7Zip.DLL.GetImage);
			delete Sync.T7Zip.DLL;
		}
	}
}
AddEvent("Finalize", Sync.T7Zip.Finalize);
if (Sync.T7Zip.DLL && Sync.T7Zip.Init()) {
	AddEvent("TranslatePath", function (Ctrl, Path) {
		if (Sync.T7Zip.IsHandle(Path)) {
			Ctrl.ENum = Sync.T7Zip.Enum;
			return ssfRESULTSFOLDER;
		}
	}, true);

	AddEvent("BeginDrag", function (Ctrl) {
		if (Sync.T7Zip.IsHandle(Ctrl, "Extract")) {
			let pdwEffect = { 0: DROPEFFECT_COPY | DROPEFFECT_MOVE | DROPEFFECT_LINK };
			api.SHDoDragDrop(Ctrl.hwndView, Ctrl.SelectedItems(), Ctrl, pdwEffect[0], pdwEffect, true);
			return false;
		}
	});

	AddEvent("BeforeGetData", function (Ctrl, Items, nMode) {
		if (!Items.Count) {
			return;
		}
		let root = BuildPath(fso.GetSpecialFolder(2).Path, "tablacus");
		let ar = [];
		for (let i = Items.Count; i--;) {
			let path = Items.Item(i).Path;
			if (api.PathMatchSpec(path, root + "\\*")) {
				if (!fso.FileExists(path)) {
					ar.unshift(path);
				}
			} else {
				return;
			}
		}
		if (!ar.length) {
			return;
		}
		let strSessionId = ar[0].substr(root.length + 1, 8);
		let lib = Sync.T7Zip.GetObject(strSessionId == Sync.T7Zip.ClipId ? Sync.T7Zip.ClipPath : Ctrl, "Extract");
		if (lib) {
			let dest = BuildPath(root, strSessionId);
			for (let i = ar.length; i--;) {
				ar[i] = api.PathQuoteSpaces(ar[i].substr(dest.length + 1));
			}
			Sync.T7Zip.CreateFolder(dest);
			Sync.T7Zip.Exec(Ctrl, lib, Sync.T7Zip.Cmd.Extract, dest, ar);
			return S_OK;
		}
	});

	AddEvent("Command", function (Ctrl, hwnd, msg, wParam, lParam) {
		return Sync.T7Zip.Command(Ctrl, wParam & 0xfff);
	}, true);

	AddEvent("InvokeCommand", function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon) {
		return Sync.T7Zip.Command(ContextMenu.FolderView, Verb);
	}, true);

	AddEvent("DefaultCommand", function (Ctrl, Selected) {
		if (Selected.Count == 1) {
			let Item = Selected.Item(0);
			let path = Item.Path;
			if (Sync.T7Zip.IsHandle(path)) {
				Ctrl.Navigate(path);
				return S_OK;
			}
			if (Sync.T7Zip.IsFolder(Item)) {
				let lib = Sync.T7Zip.GetObject(Ctrl);
				if (lib) {
					let root = BuildPath(fso.GetSpecialFolder(2).Path, api.sprintf(99, "tablacus\\%x", Ctrl.SessionId));
					path = path.replace(root, lib.file);
					Ctrl.Navigate(path);
					return S_OK;
				}
			}
		}
	}, true);

	AddEvent("ILGetParent", function (FolderItem) {
		if (Sync.T7Zip.IsHandle(FolderItem)) {
			return GetParentFolderName(FolderItem.Path);
		}
	});

	AddEvent("Context", function (Ctrl, hMenu, nPos, Selected, item, ContextMenu) {
		if (Sync.T7Zip.IsHandle(Ctrl)) {
			RemoveCommand(hMenu, ContextMenu, "rename");
		}
		return nPos;
	});

	AddEvent("DragEnter", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
		if (Ctrl.Type <= CTRL_EB || Ctrl.Type == CTRL_DT) {
			let lib = Sync.T7Zip.GetObject(Ctrl, "Add");
			if (lib) {
				Sync.T7Zip.GetDropEffect(Ctrl, dataObj, pdwEffect);
				return S_OK;
			}
		}
	});

	AddEvent("DragOver", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
		if (Ctrl.Type <= CTRL_EB || Ctrl.Type == CTRL_DT) {
			let lib = Sync.T7Zip.GetObject(Ctrl, "Add");
			if (lib) {
				Sync.T7Zip.GetDropEffect(Ctrl, dataObj, pdwEffect);
				return S_OK;
			}
		}
	});

	AddEvent("Drop", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
		let lib = Sync.T7Zip.GetObject(Ctrl, "Add");
		if (lib) {
			if (Sync.T7Zip.GetDropEffect(Ctrl, dataObj, pdwEffect)) {
				Sync.T7Zip.Append(Ctrl, dataObj);
				return S_OK;
			}
		}
	});

	AddEvent("DragLeave", function (Ctrl) {
		return S_OK;
	});

	AddEvent("AddonDisabled", function (Id) {
		if (Id.toLowerCase() == "t7zip") {
			Sync.T7Zip.Finalize();
		}
	});

	AddEvent("BeforeNavigate", function (Ctrl, fs, wFlags, Prev) {
		if (Ctrl.Type <= CTRL_EB && Sync.T7Zip.IsHandle(Prev)) {
			let root = BuildPath(fso.GetSpecialFolder(2).Path, api.sprintf(99, "tablacus\\%x", Ctrl.SessionId));
			DeleteItem(root);
		}
	});

	AddEvent("BeginLabelEdit", function (Ctrl, Name) {
		if (Ctrl.Type <= CTRL_EB) {
			if (Sync.T7Zip.IsHandle(Ctrl)) {
				return 1;
			}
		}
	});

	AddEvent("ToolTip", function (Ctrl, Index) {
		if (Ctrl.Type <= CTRL_EB) {
			if (Sync.T7Zip.IsHandle(Ctrl)) {
				let Item = Ctrl.Items.Item(Index);
				if (Sync.T7Zip.IsFolder(Item)) {
					let s = FormatDateTime(Item.ModifyDate);
					return s ? api.PSGetDisplayName("Write") + " : " + s : "";
				}
			}
		}
	});
}

AddEvent("GetIconImage", function (Ctrl, BGColor, bSimple) {
	let lib = Sync.T7Zip.GetObject(Ctrl);
	if (lib && lib.path) {
		return MakeImgDataEx("icon:shell32.dll,3", bSimple, 16);
	}
});
