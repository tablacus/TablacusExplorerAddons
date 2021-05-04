const Addon_Id = "spiplus";
const item = GetAddonElement(Addon_Id);

Sync.SPIPlus = {
	Cmd: {},
	Filter: item.getAttribute("Filter") || "*",
	Disable: item.getAttribute("Disable") || "*.exe;*.zip;*.msi;*.doc;*.xls;*.ppt;*.chm;*.docx;*.xlsx;*.epub",
	Priority: item.getAttribute("Priority") || "-",
	ExSort: !api.LowPart(item.getAttribute("NoExSort")),

	IsHandle: function (Ctrl, need) {
		return Sync.SPIPlus.GetObject(Ctrl, need) != null;
	},

	GetObject: function (Ctrl, need) {
		if (!Sync.SPI || !Sync.SPI.AM) {
			return;
		}
		const lib = {
			file: "string" === typeof Ctrl ? Ctrl : api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING),
			path: ""
		}
		for (let nDog = 32; /^[A-Z]:\\|^\\\\[A-Z]/i.test(lib.file) && nDog--;) {
			let dw;
			for (let i = 0; i < Sync.SPI.AM.length; i++) {
				const SPI = Sync.SPI.AM[i];
				if (PathMatchEx(lib.file, SPI.Filter)) {
					if (PathMatchEx(lib.file, Sync.SPIPlus.Priority) || (PathMatchEx(lib.file, Sync.SPIPlus.Filter) && !PathMatchEx(lib.file, Sync.SPIPlus.Disable))) {
						if (fso.FolderExists(lib.file)) {
							return;
						}
						if (!dw) {
							dw = api.SHCreateStreamOnFileEx(lib.file, STGM_READ | STGM_SHARE_DENY_NONE, FILE_ATTRIBUTE_NORMAL, false, null);
						}
						if (dw && SPI.IsSupported(lib.file, dw)) {
							lib.SPI = SPI;
							return lib;
						}
					}
				}
			}
			if (dw) {
				dw.Free();
			}
			lib.path = BuildPath(GetFileName(lib.file), lib.path);
			lib.file = GetParentFolderName(lib.file);
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
			switch ("string" === typeof Verb ? Sync.SPIPlus.StringToVerb[Verb.toLowerCase()] : Verb + 1) {
				case CommandID_COPY:
				case CommandID_CUT:
					const lib = Sync.SPIPlus.GetObject(Ctrl, "Extract");
					if (lib) {
						api.OleSetClipboard(Ctrl.SelectedItems());
						Sync.SPIPlus.ClipId = api.sprintf(9, "%x", Ctrl.SessionId);
						Sync.SPIPlus.ClipPath = lib.file;
						return S_OK;
					}
					break;
			}
		}
	},

	Enum: function (pid, Ctrl, fncb, SessionId) {
		const lib = Sync.SPIPlus.GetObject(pid.Path);
		if (lib) {
			const Items = api.CreateObject("FolderItems");
			const Folder = {};
			const Folder2 = {};
			const root = BuildPath(fso.GetSpecialFolder(2).Path, api.sprintf(99, "tablacus\\%x", SessionId));
			const pFileInfo = [];
			lib.SPI.GetArchiveInfo(lib.file, 0, 0, pFileInfo, function () {
				return {};
			});
			for (let i = 0; i < pFileInfo.length; i++) {
				let fn = BuildPath(pFileInfo[i].path, pFileInfo[i].filename).replace(/\//g, "\\");
				const strParent = GetParentFolderName(fn).toLowerCase();
				if (strParent == lib.path.toLowerCase() && pFileInfo[i].filesize) {
					let dwAttr = 0;
					if (/\\$|\/$/.test(fn)) {
						fn = fn.replace(/\\$|\/$/, "");
						dwAttr = FILE_ATTRIBUTE_DIRECTORY;
						Folder[fn] = 1;
					}
					Items.AddItem(api.SHSimpleIDListFromPath(BuildPath(root, fn), dwAttr, pFileInfo[i].timestamp, pFileInfo[i].filesize));
				}
				while (/\\/.test(fn)) {
					fn = GetParentFolderName(fn);
					if (!fn) {
						break;
					}
					Folder2[fn] = 1;
				}
			}
			for (let fn in Folder2) {
				if (!Folder[fn]) {
					const strParent = GetParentFolderName(fn).toLowerCase();
					if (strParent == lib.path.toLowerCase()) {
						Items.AddItem(api.SHSimpleIDListFromPath(BuildPath(root, fn), FILE_ATTRIBUTE_DIRECTORY, new Date(), 0));
					}
				}
			}
			return Items;
		}
	},

	ProgressCallback: function (nNum, nDemon, lData) {
		const info = Sync.SPIPlus.pFileInfo[lData];
		if (info) {
			if (Sync.SPIPlus.Progress) {
				Sync.SPIPlus.ShowProgress(Sync.SPIPlus.SizeCurrent + info.filesize * nNum / Math.max(nDemon, 1), lData + 1);
			}
			return Sync.SPIPlus.Progress.HasUserCancelled() ? 1 : 0;
		}
		return 0;
	},

	ShowProgress: function (nCurrent, i) {
		const points = Math.min(Math.floor(nCurrent * 100 / Sync.SPIPlus.SizeTotal), 100);
		let s3 = 6466, s4 = 6466;
		let t = Sync.SPIPlus.pFileInfo.length;
		if (g_.IEVer > 8) {
			s3 = i > 1 ? 38192 : 38193;
			s4 = t > 1 ? 38192 : 38193;
			if (i > 999) {
				i = i.toLocaleString();
			}
			if (t > 999) {
				t = t.toLocaleString();
			}
		}
		const sItem = (api.LoadString(hShell32, s3) || "%s items").replace(/%1!ls!|%s/g, i);
		const sTotal = (api.LoadString(hShell32, s3) || "%s items").replace(/%1!ls!|%s/g, t);
		Sync.SPIPlus.Progress.SetTitle(points + "% (" + sItem + ' / ' + sTotal + ')');
		Sync.SPIPlus.Progress.SetProgress(points, 100);
		Sync.SPIPlus.Progress.SetLine(1, [api.LoadString(hShell32, 5954) || api.LoadString(hShell32, 32946), " (", api.StrFormatByteSize(nCurrent), ' / ', api.StrFormatByteSize(Sync.SPIPlus.SizeTotal), ")"].join(""), true);
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

	IsFolder: function (Item) {
		const wfd = api.Memory("WIN32_FIND_DATA");
		api.SHGetDataFromIDList(Item, SHGDFIL_FINDDATA, wfd, wfd.Size);
		return wfd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY;
	},

	Debug: function (s) {
		if (Sync.Debug) {
			Sync.Debug.alert(s);
		} else {
			api.OutputDebugString(s + "\n");
		}
	}
}

AddEvent("Load", function () {
	if (Sync.SPI && Sync.SPI.AM && Sync.SPI.AM.length) {
		AddEvent("TranslatePath", function (Ctrl, Path) {
			if (Sync.SPIPlus.IsHandle(Path)) {
				Ctrl.ENum = Sync.SPIPlus.Enum;
				return ssfRESULTSFOLDER;
			}
		}, true);

		AddEvent("BeginDrag", function (Ctrl) {
			if (Sync.SPIPlus.IsHandle(Ctrl, "Extract")) {
				const pdwEffect = [ DROPEFFECT_COPY | DROPEFFECT_MOVE | DROPEFFECT_LINK ];
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
				const Item = Items.Item(i);
				const path = Item.Path;
				if (api.PathMatchSpec(path, root + "\\*")) {
					if (!fso.FileExists(path)) {
						ar.unshift(Sync.SPIPlus.IsFolder(Item) ? BuildPath(path, "*") : path);
					}
				} else {
					return;
				}
			}
			if (!ar.length) {
				return;
			}
			const strSessionId = ar[0].substr(root.length + 1).replace(/\\.*/, "");
			const lib = Sync.SPIPlus.GetObject(strSessionId == Sync.SPIPlus.ClipId ? Sync.SPIPlus.ClipPath : Ctrl, "Extract");
			if (lib) {
				let hr = S_OK;
				const dest = BuildPath(root, strSessionId);
				const pFileInfo = [];
				lib.SPI.GetArchiveInfo(lib.file, 0, 0, pFileInfo, function () {
					return {};
				});
				Sync.SPIPlus.pFileInfo = [];
				for (let i = 0; i < ar.length; i++) {
					let filter = ar[i].substr(dest.length + 1);
					if (/\\$/.test(filter)) {
						filter += "*";
					}
					for (let j = 0; j < pFileInfo.length; j++) {
						const info = pFileInfo[j];
						const path = BuildPath(info.path, info.filename).replace(/\//g, "\\");
						if (api.PathMatchSpec(path, filter) && !api.PathMatchSpec(path, "*..\\*")) {
							Sync.SPIPlus.pFileInfo.push(info);
						}
					}
				}
				if (!pFileInfo.length) {
					return S_FALSE;
				}
				Sync.SPIPlus.SizeCurrent = 0;
				Sync.SPIPlus.SizeTotal = 0;
				for (let i = 0; i < Sync.SPIPlus.pFileInfo.length; i++) {
					const info = Sync.SPIPlus.pFileInfo[i];
					Sync.SPIPlus.SizeTotal += info.filesize;
				}
				Sync.SPIPlus.Progress = api.CreateObject("ProgressDialog");
				Sync.SPIPlus.Progress.StartProgressDialog(te.hwnd, null, 2);
				try {
					for (let i = 0; i < Sync.SPIPlus.pFileInfo.length; i++) {
						const info = Sync.SPIPlus.pFileInfo[i];
						const path1 = BuildPath(info.path, info.filename).replace(/\//g, "\\");
						const path = BuildPath(dest, path1);
						Sync.SPIPlus.Progress.SetLine(2, path1, true);
						Sync.SPIPlus.ShowProgress(Sync.SPIPlus.SizeCurrent, i + 1);
						Sync.SPIPlus.CreateFolder(GetParentFolderName(path));
						lib.SPI.GetFile(lib.file, info.position, path, 0, Sync.SPIPlus.ProgressCallback, i);
						if (Sync.SPIPlus.Progress.HasUserCancelled()) {
							hr = E_ABORT;
							break;
						}
						api.SetFileTime(path, null, null, info.timestamp);
						Sync.SPIPlus.SizeCurrent += info.filesize;
					}
				} catch (e) {
					ShowError(e, "SPIPlus");
				}
				Sync.SPIPlus.Progress.StopProgressDialog();
				delete Sync.SPIPlus.Progress;
				return hr;
			}
		});

		AddEvent("Command", function (Ctrl, hwnd, msg, wParam, lParam) {
			return Sync.SPIPlus.Command(Ctrl, wParam & 0xfff);
		}, true);

		AddEvent("InvokeCommand", function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon) {
			return Sync.SPIPlus.Command(ContextMenu.FolderView, Verb);
		}, true);

		AddEvent("DefaultCommand", function (Ctrl, Selected) {
			if (Selected.Count == 1) {
				const Item = Selected.Item(0);
				let path = Item.Path;
				if (Sync.SPIPlus.IsHandle(path)) {
					Ctrl.Navigate(path);
					return S_OK;
				}
				if (Sync.SPIPlus.IsFolder(Item)) {
					const lib = Sync.SPIPlus.GetObject(Ctrl);
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
			if (Sync.SPIPlus.IsHandle(FolderItem)) {
				return GetParentFolderName(FolderItem.Path);
			}
		});

		AddEvent("Context", function (Ctrl, hMenu, nPos, Selected, item, ContextMenu) {
			if (Sync.SPIPlus.IsHandle(Ctrl)) {
				RemoveCommand(hMenu, ContextMenu, "rename");
			}
			return nPos;
		});

		AddEvent("BeforeNavigate", function (Ctrl, fs, wFlags, Prev) {
			if (Ctrl.Type <= CTRL_EB && Sync.SPIPlus.IsHandle(Prev)) {
				const root = BuildPath(fso.GetSpecialFolder(2).Path, api.sprintf(99, "tablacus\\%x", Ctrl.SessionId));
				DeleteItem(root);
			}
		});

		AddEvent("BeginLabelEdit", function (Ctrl, Name) {
			if (Ctrl.Type <= CTRL_EB) {
				if (Sync.SPIPlus.IsHandle(Ctrl)) {
					return 1;
				}
			}
		});

		AddEvent("ToolTip", function (Ctrl, Index) {
			if (Ctrl.Type <= CTRL_EB) {
				if (Sync.SPIPlus.IsHandle(Ctrl)) {
					const Item = Ctrl.Items.Item(Index);
					if (Sync.SPIPlus.IsFolder(Item)) {
						const s = FormatDateTime(Item.ModifyDate);
						return s ? api.PSGetDisplayName("Write") + " : " + s : "";
					}
				}
			}
		});
	}

	AddEvent("GetIconImage", function (Ctrl, clBk, bSimple) {
		const lib = Sync.SPIPlus.GetObject(Ctrl);
		if (lib && lib.path) {
			return MakeImgDataEx("icon:shell32.dll,3", bSimple, 16, clBk);
		}
	});

	if (Sync.SPIPlus.ExSort) {
		AddEvent("Sort", function (Ctrl) {
			if (Ctrl.Type <= CTRL_EB) {
				if (Sync.SPIPlus.IsHandle(Ctrl)) {
					const s1 = Ctrl.SortColumns;
					if (/^prop:\-?System\.ItemNameDisplay;$|^prop:\-?System\.DateModified;$/.test(s1)) {
						setTimeout(function () {
							Ctrl.SortColumns = s1 + 'System.ItemTypeText;';
						}, 99);
					}
				}
			}
		});

		AddEvent("ColumnClick", function (Ctrl, iItem) {
			if (Ctrl.Type <= CTRL_EB) {
				if (Sync.SPIPlus.IsHandle(Ctrl)) {
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
	}
});
