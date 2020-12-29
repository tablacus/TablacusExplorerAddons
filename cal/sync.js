const Addon_Id = "cal";

Sync.CAL = {
	IsHandle: function (Ctrl, need) {
		return Sync.CAL.GetObject(Ctrl, need) != null;
	},

	GetObject: function (Ctrl, need) {
		if (!Sync.CAL.DLL) {
			return;
		}
		const lib = {
			file: "string" === typeof Ctrl ? Ctrl : api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL),
			path: ""
		}
		if (!Sync.CAL.Obj) {
			Sync.CAL.Init();
		}
		let nDog = 32;
		while (/^[A-Z]:\\|^\\\\[A-Z]/i.test(lib.file) && nDog--) {
			for (let i in Sync.CAL.Obj) {
				const item = Sync.CAL.Obj[i];
				if (item.X.Filter && api.PathMatchSpec(lib.file, item.X.Filter)) {
					if (!need || item[need]) {
						if ((item.X.CheckArchive && item.X.CheckArchive(lib.file, 0) !== false) ||
							(item[need] && need != "wait" && item.X.Exec)) {
							for (let j in item) {
								lib[j] = item[j];
							}
							return lib;
						}
						if (need == "wait" && item.X.GetRunning()) {
							lib.busy = true;
							return lib;
						}
					}
				}
			}
			lib.path = BuildPath(fso.GetFileName(lib.file), lib.path);
			lib.file = GetParentFolderName(lib.file);
		};
	},

	Init: function () {
		Sync.CAL.Obj = [];
		const items = Sync.CAL.xml.getElementsByTagName("Item");
		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			const dllPath = ExtractMacro(te, api.PathUnquoteSpaces(item.getAttribute("Path")).replace(/\*/g, api.sizeof("HANDLE") * 8));
			const procName = item.getAttribute("Name").replace(/\W.*$/, "");
			if (/\.exe"?\s*/i.test(dllPath)) {
				CAL = Sync.CAL.OpenExe(dllPath);
			} else {
				CAL = Sync.CAL.DLL.Open(dllPath, procName);
			}
			if (!CAL && api.sizeof("HANDLE") == 8 && /UNLHA[36][24].DLL$|UNZIP[36][24].DLL$|ZIP[36][24]J\.DLL$|TAR[36][24]\.DLL$|CAB[36][24]\.DLL$|UNRAR[36][24]\.DLL$|7\-ZIP[36][24]\.DLL$/i.test(dllPath)) {
				CAL = Sync.CAL.DLL.Open(dllPath.replace(/[^\\]*\.dll$/, "UNBYPASS.DLL"), procName);
			}
			if (CAL && CAL.Exec) {
				CAL.Name = procName;
				CAL.Filter = item.getAttribute("Filter");
				CAL.Extract = item.getAttribute("Extract");
				CAL.Add = item.getAttribute("Add");
				CAL.Delete = item.getAttribute("Delete");
				CAL.Content = item.getAttribute("Content") || "*";
				CAL.IsContent = GetNum(item.getAttribute("IsContent"));
				CAL.ContentFilter = item.getAttribute("ContentFilter") || "*";
				Sync.CAL.Obj.push({
					X: CAL,
					Name: procName,
					Extract: CAL.Extract,
					Add: CAL.Add,
					Delete: CAL.Delete,
					wait: 1
				});
				if (CAL.ExtractMem) {
					Sync.CAL.GetArchive = true;
					if (CAL.IsContent) {
						Sync.CAL.GetImage = true;
					}
				}
			}
		}
		if (Sync.CAL.GetArchive) {
			te.AddEvent("GetArchive", Sync.CAL.DLL.GetArchive);
		}
		if (Sync.CAL.GetImage) {
			te.AddEvent("GetImage", Sync.CAL.DLL.GetImage(api.GetProcAddress(null, "GetImage")));
		}
	},

	Exec: function (Ctrl, lib, strCmd, strPath, arList, bRefresh, arFull) {
		strCmd = strCmd.replace(/%archive%/i, api.PathQuoteSpaces(lib.file));
		strCmd = strCmd.replace(/%base%/i, lib.path);
		if (/%path%/i.test(strCmd)) {
			strCmd = strCmd.replace(/%path%/i, strPath);
		} else if (arFull) {
			strCmd = strCmd.replace(/%items%/i, arFull.join(" "));
		}
		strCmd = strCmd.replace(/%items%/i, arList.join(" ")).replace(/%opt%/i, "");
		const pszOut = [];
		const r = lib.X.Exec(te.hwnd, strCmd, pszOut, 9999);
		if (r) {
			setTimeout(function ()
			{
				MessageBox([api.sprintf(99, "Error: %x", r), lib.X.Name, strCmd, pszOut[0]].join("\n").replace(/^\s*/, ""), TITLE, MB_ICONSTOP);
			}, 99);
		} else if (bRefresh) {
			InvokeUI("Addons.CAL.Refresh", Ctrl);
		}
		api.OutputDebugString(lib.X.Name + " " + strCmd + "\n");
		api.OutputDebugString(api.sprintf(9, "%x", r) + " " + pszOut[0] + "\n");
		return r;
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
			switch ("string" === typeof Verb ? Sync.CAL.StringToVerb[Verb.toLowerCase()] : Verb + 1) {
				case CommandID_PASTE:
					if (Sync.CAL.Append(Ctrl, api.OleGetClipboard())) {
						return S_OK;
					}
					break;
				case CommandID_DELETE:
					if (Sync.CAL.Delete(Ctrl)) {
						return S_OK;
					}
					break;
				case CommandID_COPY:
				case CommandID_CUT:
					const lib = Sync.CAL.GetObject(Ctrl, "Extract");
					if (lib) {
						api.OleSetClipboard(Ctrl.SelectedItems());
						Sync.CAL.ClipId = api.sprintf(9, "%x", Ctrl.SessionId);
						Sync.CAL.ClipPath = lib.file;
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
		const lib = Sync.CAL.GetObject(Ctrl, "Add");
		if (lib) {
			let ar = [], arFull = [], root;
			if (lib.path) {
				root = BuildPath(fso.GetSpecialFolder(2).Path, api.sprintf(99, "tablacus\\%x", Ctrl.SessionId));
				const path = BuildPath(root, lib.path);
				DeleteItem(path);
				Sync.CAL.CreateFolder(path);
				const oDest = sha.NameSpace(path);
				if (oDest) {
					oDest.CopyHere(Items, FOF_NOCONFIRMATION | FOF_NOCONFIRMMKDIR);
					ar.push(lib.path);
					arFull.push(path);
				}
			} else {
				root = Items.Item(-1).Path;
				for (let i = Items.Count; i-- > 0;) {
					const Item = Items.Item(i);
					ar.unshift(api.PathQuoteSpaces(Item.Path.replace(root, "").replace(/^\\/, "")));
					arFull.unshift(api.PathQuoteSpaces(Item.Path));
				}
			}
			Sync.CAL.Exec(Ctrl, lib, lib.X.Add, root, ar, true, arFull);
			return true;
		}
	},

	Delete: function (Ctrl) {
		const Items = Ctrl.SelectedItems();
		if (!Items.Count) {
			return;
		}
		const lib = Sync.CAL.GetObject(Ctrl, "Delete");
		if (lib) {
			if (!confirmOk()) {
				return;
			}
			const root = BuildPath(fso.GetSpecialFolder(2).Path, api.sprintf(99, "tablacus\\%x", Ctrl.SessionId));
			const ar = [];
			for (let i = Items.Count; i-- > 0;) {
				ar.unshift(api.PathQuoteSpaces(Items.Item(i).Path.replace(root, "").replace(/^\\/, "")));
			}
			Sync.CAL.Exec(Ctrl, lib, lib.X.Delete, root, ar, true);
			return true;
		}
	},

	Enum: function (pid, Ctrl, fncb, SessionId) {
		const lib = Sync.CAL.GetObject(pid.Path, "wait");
		if (lib) {
			if (lib.busy) {
				setTimeout(function () {
					Sync.CAL.Enum(pid, Ctrl, fncb);
				}, 500);
				return;
			}
			const Items = te.FolderItems();
			const root = BuildPath(fso.GetSpecialFolder(2).Path, api.sprintf(99, "tablacus\\%x", Ctrl.SessionId));
			const harc = lib.X.OpenArchive(te.hwnd, lib.file, 1);
			if (harc) {
				const info = {};
				let iFind = lib.X.FindFirst(harc, "", info);
				const Folder = {}, Folder2 = {};
				while (iFind == 0) {
					let fn = info.szFileName.replace(/\//g, "\\");
					if (/\.\.\\|:/.test(fn)) {
						continue;
					}
					const strParent = GetParentFolderName(fn).toLowerCase();
					if (strParent == lib.path.toLowerCase()) {
						let dwAttr = 0;
						if (/\\$/.test(fn)) {
							dwAttr = FILE_ATTRIBUTE_DIRECTORY;
							Folder[fn.replace(/\\$/, "")] = 1;
						}
						Items.AddItem(api.SHSimpleIDListFromPath(BuildPath(root, fn), dwAttr, info.DateTime, info.dwOriginalSize));
					}
					while (/[\\|\/]/.test(fn)) {
						fn = GetParentFolderName(fn);
						if (!fn) {
							break;
						}
						Folder2[fn] = 1;
					}
					iFind = lib.X.FindNext(harc, info);
				}
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
			if (fncb) {
				fncb(Ctrl, Items)
			}
		}
	},

	OpenExe: function (path) {
		return {
			EXE: path,

			Exec: function (hwnd, strCmd, pszOutput) {
				let dir = ExtractMacro(te, "%temp%");
				const re = /"([^"]*)\\"/;
				const res = re.exec(strCmd);
				if (res) {
					dir = res[1];
					strCmd = strCmd.replace(re, "");
				}
				const r = api.CreateProcess(this.EXE + ' ' + strCmd, dir, 0, 0, 0);
				if ("number" !== typeof r) {
					pszOutput[0] = r || "";
					return 0;
				}
				pszOutput[0] = "Error!";
				return r;
			},

			GetRunning: function () {
				return false;
			}

		};
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

	Finalize: function () {
		delete Sync.CAL.Obj;
		CollectGarbage();
		if (Sync.CAL.DLL) {
			if (Sync.CAL.GetArchive) {
				te.RemoveEvent("GetArchive", Sync.CAL.DLL.GetArchive);
			}
			if (Sync.CAL.GetImage) {
				te.RemoveEvent("GetImage", Sync.CAL.DLL.GetImage);
			}
			delete Sync.CAL.DLL;
		}
	}
}

Sync.CAL.DLL = api.DllGetClassObject(BuildPath(te.Data.Installed, "addons\\cal\\tcal" + (api.sizeof("HANDLE") * 8) + '.dll'), "{D45DF22D-DA6A-406b-8C1E-5A6642B5BEE3}");

Sync.CAL.xml = OpenXml("cal.xml", false, true);

AddEvent("Finalize", Sync.CAL.Finalize);

AddEvent("TranslatePath", function (Ctrl, Path) {
	if (Sync.CAL.IsHandle(Path)) {
		Ctrl.ENum = Sync.CAL.Enum;
		return ssfRESULTSFOLDER;
	}
}, true);

AddEvent("BeginDrag", function (Ctrl) {
	if (Sync.CAL.IsHandle(Ctrl, "Extract")) {
		const pdwEffect = { 0: DROPEFFECT_COPY | DROPEFFECT_MOVE | DROPEFFECT_LINK };
		api.SHDoDragDrop(Ctrl.hwndView, Ctrl.SelectedItems(), Ctrl, pdwEffect[0], pdwEffect, true);
		return false;
	}
});

AddEvent("BeforeGetData", function (Ctrl, Items, nMode) {
	if (!Items.Count) {
		return;
	}
	const root = BuildPath(fso.GetSpecialFolder(2).Path, "tablacus");
	const ar = [];
	for (let i = Items.Count; i--;) {
		const path = Items.Item(i).Path;
		if (!api.StrCmpNI(root, path, root.length) && !fso.FileExists(path)) {
			ar.unshift(path);
		}
	}
	if (!ar.length) {
		return;
	}
	const strSessionId = GetParentFolderName(ar[0]).replace(root + "\\", "").replace(/\\.*/, "");
	const lib = Sync.CAL.GetObject(strSessionId == Sync.CAL.ClipId ? Sync.CAL.ClipPath : Ctrl, "Extract");
	if (lib) {
		const dest = BuildPath(root, strSessionId);
		for (let i = ar.length; i--;) {
			ar[i] = api.PathQuoteSpaces(ar[i].replace(dest, "").replace(/^\\/, ""));
		}
		Sync.CAL.CreateFolder(dest);
		Sync.CAL.Exec(Ctrl, lib, lib.X.Extract, dest, ar);
		return S_OK;
	}
});

AddEvent("Command", function (Ctrl, hwnd, msg, wParam, lParam) {
	return Sync.CAL.Command(Ctrl, wParam & 0xfff);
}, true);

AddEvent("InvokeCommand", function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon) {
	return Sync.CAL.Command(ContextMenu.FolderView, Verb);
}, true);

AddEvent("DefaultCommand", function (Ctrl, Selected) {
	if (Selected.Count == 1) {
		let path = api.GetDisplayNameOf(Selected.Item(0), SHGDN_FORPARSING | SHGDN_FORADDRESSBAR | SHGDN_ORIGINAL);
		if (Sync.CAL.IsHandle(path)) {
			Ctrl.Navigate(path);
			return S_OK;
		}
		if (Selected.Item(0).IsFolder) {
			const lib = Sync.CAL.GetObject(Ctrl);
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
	if (Sync.CAL.IsHandle(FolderItem)) {
		return GetParentFolderName(FolderItem.Path);
	}
});

AddEvent("Context", function (Ctrl, hMenu, nPos, Selected, item, ContextMenu) {
	const path = api.GetDisplayNameOf(Ctrl.FolderItem, SHGDN_FORPARSING | SHGDN_FORADDRESSBAR | SHGDN_ORIGINAL);
	if (Sync.CAL.IsHandle(path)) {
		RemoveCommand(hMenu, ContextMenu, "rename");
	}
	return nPos;
});

AddEvent("DragEnter", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
	if (Ctrl.Type <= CTRL_EB || Ctrl.Type == CTRL_DT) {
		const lib = Sync.CAL.GetObject(Ctrl, "Add");
		if (lib) {
			return S_OK;
		}
	}
});

AddEvent("DragOver", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
	if (Ctrl.Type <= CTRL_EB || Ctrl.Type == CTRL_DT) {
		const lib = Sync.CAL.GetObject(Ctrl, "Add");
		if (lib) {
			pdwEffect[0] = DROPEFFECT_COPY;
			return S_OK;
		}
	}
});

AddEvent("Drop", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
	const lib = Sync.CAL.GetObject(Ctrl, "Add");
	if (lib) {
		Sync.CAL.Append(Ctrl, dataObj);
		return S_OK;
	}
});

AddEvent("DragLeave", function (Ctrl) {
	return S_OK;
});

AddEvent("AddonDisabled", function (Id) {
	if (Id.toLowerCase() == "cal") {
		Sync.CAL.Finalize();
	}
});

AddEvent("BeforeNavigate", function (Ctrl, fs, wFlags, Prev) {
	if (Ctrl.Type <= CTRL_EB && Sync.CAL.IsHandle(Prev)) {
		const root = BuildPath(fso.GetSpecialFolder(2).Path, api.sprintf(99, "tablacus\\%x", Ctrl.SessionId));
		DeleteItem(root);
	}
});

AddEvent("BeginLabelEdit", function (Ctrl, Name) {
	if (Ctrl.Type <= CTRL_EB) {
		if (Sync.CAL.IsHandle(Ctrl)) {
			return 1;
		}
	}
});

AddEvent("ToolTip", function (Ctrl, Index) {
	if (Ctrl.Type <= CTRL_EB) {
		if (Sync.CAL.IsHandle(Ctrl)) {
			const Item = Ctrl.Items.Item(Index);
			if (Item.IsFolder) {
				const s = FormatDateTime(Item.ModifyDate);
				return s ? api.PSGetDisplayName("Write") + " : " + s : "";
			}
		}
	}
});
