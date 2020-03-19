var Addon_Id = "t7zip";
var item = GetAddonElement(Addon_Id);

Addons.T7Zip =
{
	DLL: api.DllGetClassObject(fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), ["addons\\t7zip\\t7z", api.sizeof("HANDLE") * 8, ".dll"].join("")), "{BFD084CA-C9AA-4bd3-9984-D5ED699A0711}"),
	Cmd: {},
	Mode: { Extract: 1, Add: 2, Delete: 3 },

	IsHandle: function (Ctrl, need) {
		return Addons.T7Zip.GetObject(Ctrl, need) != null;
	},

	GetObject: function (Ctrl, need) {
		if (!Addons.T7Zip.DLL || Addons.T7Zip.Cmd[need] === "-") {
			return;
		}
		var lib = {
			file: "string" === typeof Ctrl ? Ctrl : api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL),
			path: ""
		}
		for (var nDog = 32; /^[A-Z]:\\|^\\\\[A-Z]/i.test(lib.file) && nDog--;) {
			if (Addons.T7Zip.DLL.IsSupported(lib.file, Addons.T7Zip.Mode[need])) {
				return lib;
			}
			lib.path = fso.BuildPath(fso.GetFileName(lib.file), lib.path);
			lib.file = fso.GetParentFolderName(lib.file);
		}
	},

	Exec: function (Ctrl, lib, strCmd, strPath, arList, bRefresh) {
		strCmd = strCmd.replace(/%archive%/i, api.PathQuoteSpaces(lib.file));
		strCmd = strCmd.replace(/%items%/i, arList.join(" "));
		if (!/^[A-Z]:\\|^\\\\[A-Z]/i.test(strPath)) {
			strPath = null;
		}
		var r = api.CreateProcess(Addons.T7Zip.Exe + ' ' + strCmd, strPath, 0, 0, 0, true);
		Addons.T7Zip.Debug([Addons.T7Zip.Exe, strCmd, "(CD:" + (strPath || "").replace(fso.GetSpecialFolder(2).Path, "%TEMP%"), ')'].join(" "));
		if ("number" === typeof r) {
			setTimeout(function () {
				MessageBox([api.sprintf(99, "Error: %d", r), Addons.T7Zip.Exe, strCmd].join("\n").replace(/^\s*/, ""), TITLE, MB_ICONSTOP);
			}, 99);
		} else {
			var bWait;
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
			switch ("string" === typeof Verb ? Addons.T7Zip.StringToVerb[Verb.toLowerCase()] : Verb + 1) {
				case CommandID_PASTE:
					if (Addons.T7Zip.Append(Ctrl, api.OleGetClipboard())) {
						return S_OK;
					}
					break;
				case CommandID_DELETE:
					if (Addons.T7Zip.Delete(Ctrl)) {
						return S_OK;
					}
					break;
				case CommandID_COPY:
				case CommandID_CUT:
					var lib = Addons.T7Zip.GetObject(Ctrl, "Extract");
					if (lib) {
						api.OleSetClipboard(Ctrl.SelectedItems());
						Addons.T7Zip.ClipId = api.sprintf(9, "%x", Ctrl.SessionId);
						Addons.T7Zip.ClipPath = lib.file;
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
		var lib = Addons.T7Zip.GetObject(Ctrl, "Add");
		if (lib) {
			var ar = [], root;
			if (lib.path) {
				var root = fso.BuildPath(fso.GetSpecialFolder(2).Path, api.sprintf(99, "tablacus\\%x", Ctrl.SessionId));
				var path = fso.BuildPath(root, lib.path);
				DeleteItem(path);
				Addons.T7Zip.CreateFolder(path);
				var oDest = sha.NameSpace(path);
				if (oDest) {
					oDest.CopyHere(Items, FOF_NOCONFIRMATION | FOF_NOCONFIRMMKDIR);
					ar.push(lib.path);
				}
			} else {
				var root = Items.Item(-1).Path;
				if (!/^[A-Z]:\\|^\\\\[A-Z]/i.test(root)) {
					root = fso.GetParentFolderName(Items.Item(0).Path);
				}
				for (var i = Items.Count; i-- > 0;) {
					var Item = Items.Item(i);
					ar.unshift(api.PathQuoteSpaces(Item.Path.replace(root, "").replace(/^\\/, "")));
				}
			}
			Addons.T7Zip.Exec(Ctrl, lib, Addons.T7Zip.Cmd.Add, root, ar, true);
			return true;
		}
	},

	Delete: function (Ctrl) {
		var Items = Ctrl.SelectedItems();
		if (!Items.Count) {
			return;
		}
		var lib = Addons.T7Zip.GetObject(Ctrl, "Delete");
		if (lib) {
			if (!confirmOk("Are you sure?")) {
				return;
			}
			var root = fso.BuildPath(fso.GetSpecialFolder(2).Path, api.sprintf(99, "tablacus\\%x", Ctrl.SessionId));
			var ar = [];
			for (var i = Items.Count; i-- > 0;) {
				ar.unshift(api.PathQuoteSpaces(Items.Item(i).Path.replace(root, "").replace(/^\\/, "")));
			}
			Addons.T7Zip.Exec(Ctrl, lib, Addons.T7Zip.Cmd.Delete, fso.GetSpecialFolder(2).Path, ar, true);
			return true;
		}
	},

	Enum: function (pid, Ctrl, fncb, SessionId) {
		var lib = Addons.T7Zip.GetObject(pid.Path);
		if (lib) {
			var q = {
				Items: api.CreateObject("FolderItems"),
				Path: lib.file,
				Folder: {},
				Folder2: {},
				lib: lib,
				root: fso.BuildPath(fso.GetSpecialFolder(2).Path, api.sprintf(99, "tablacus\\%x", SessionId)),
				GetProperty: Addons.T7Zip.GetProperty,
				GetPassword: Addons.T7Zip.GetPassword
			}
			Addons.T7Zip.DLL.GetArchiveInfo(q);
			for (var fn in q.Folder2) {
				if (!q.Folder[fn]) {
					var strParent = fso.GetParentFolderName(fn).toLowerCase();
					if (strParent == lib.path.toLowerCase()) {
						q.Items.AddItem(api.SHSimpleIDListFromPath(fso.BuildPath(q.root, fn), FILE_ATTRIBUTE_DIRECTORY, new Date(), 0));
					}
				}
			}
			return q.Items;
		}
	},

	GetProperty: function (q, Path, IsDir, Size, MTime) {
		var fn = Path.replace(/\//g, "\\");
		var strParent = fso.GetParentFolderName(fn).toLowerCase();
		if (strParent == q.lib.path.toLowerCase()) {
			var dwAttr = 0;
			if (IsDir) {
				dwAttr = FILE_ATTRIBUTE_DIRECTORY;
				q.Folder[fn] = 1;
			}
			q.Items.AddItem(api.SHSimpleIDListFromPath(fso.BuildPath(q.root, fn), dwAttr, MTime, Size));
		}
		while (/\\/.test(fn)) {
			fn = fso.GetParentFolderName(fn);
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
		var s = fso.GetParentFolderName(path);
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
			if (!api.PathMatchSpec(dataObj.Item(0).Path, fso.BuildPath(fso.GetSpecialFolder(2).Path, api.sprintf(99, "tablacus\\%x\\*", Ctrl.SessionId)))) {
				pdwEffect[0] = DROPEFFECT_COPY;
				return true;
			}
		}
	},

	Init: function ()
	{
		if (Addons.T7Zip.DLL) {
			var bit = api.sizeof("HANDLE") * 8;
			var strDll = api.PathUnquoteSpaces(ExtractMacro(te, item.getAttribute("Dll" + bit)));
			if (!strDll || !Addons.T7Zip.DLL.Init(strDll)) {
				if (!Addons.T7Zip.DLL.Init("C:\\Program Files\\7-Zip\\7z.dll")) {
					if (!Addons.T7Zip.DLL.Init("C:\\Program Files (x86)\\7-Zip\\7z.dll")) {
						return;
					}
				}
			}
			var strExe = api.PathUnquoteSpaces(ExtractMacro(te, item.getAttribute("Exe" + bit)));
			if (!strExe || !fso.FileExists(strExe)) {
				strExe = Addons.T7Zip.DLL.Path.replace(/7z\.dll$/i, "7zG.exe");
				if (!fso.FileExists(strExe)) {
					strExe = 'C:\\Program Files\\7-Zip\\7zG.exe';
				}
			}
			Addons.T7Zip.Exe = api.PathQuoteSpaces(strExe);
			var q = { List: {}, Update: {} };
			Addons.T7Zip.DLL.GetHandlerProperty2(q, function (q, Name, ClassID, Extension, AddExtension, Update, KeepName, Signature, MultiSignature, SignatureOffset, AltStreams, NtSecure, Flags) {
				var ext = Extension.split(/\s/);
				for (var s in ext) {
					q.List[ext[s]] = 1;
					if (Update) {
						q.Update[ext[s]] = 1;
					}
				}
			});
			var ar = [];
			for (var s in q.List) {
				ar.push("*." + s);
			}
			Addons.T7Zip.DLL.FilterList = item.getAttribute("FilterList") || ar.join(";") || "*.7z;*.zip";
			Addons.T7Zip.DLL.DisableList = item.getAttribute("DisableList") || "*.chm;*.doc;*.docx;*.epub;*.exe;*.msi;*.ods;*.odt;*.ppt;*.xls;*.xlsx;*.zip";

			Addons.T7Zip.DLL.FilterExtract = item.getAttribute("FilterExtract") || ar.join(";") || "*.7z;*.zip";
			Addons.T7Zip.DLL.DisableExtract = item.getAttribute("DisableExtract") || "*.zip";
			ar.length = 0;
			for (var s in q.Update) {
				ar.push("*." + s);
			}
			Addons.T7Zip.DLL.FilterUpdate = item.getAttribute("FilterUpdate") || ar.join(";") || "-";
			Addons.T7Zip.DLL.DisableUpdate = item.getAttribute("DisableUpdate") || "*.zip";

			Addons.T7Zip.DLL.FilterContent = item.getAttribute("FilterContent") || "*";
			Addons.T7Zip.DLL.DisableContent = item.getAttribute("DisableContent") || "-";

			Addons.T7Zip.DLL.FilterPreview = item.getAttribute("FilterPreview") || "*";
			Addons.T7Zip.DLL.DisablePreview = item.getAttribute("DisablePreview") || "-";

			Addons.T7Zip.DLL.IsContent = !api.LowPart(item.getAttribute("NoContent"));

			Addons.T7Zip.Cmd.Extract = (item.getAttribute("CmdExtract") || 'x') + ' %archive% %items%';
			Addons.T7Zip.Cmd.Add = (item.getAttribute("CmdAdd") || 'a') + ' %archive% %items%';
			Addons.T7Zip.Cmd.Delete = (item.getAttribute("CmdDelete") || 'd') + ' %archive% %items%';

			Addons.T7Zip.DLL.hwnd = te.hwnd;
			if  (!api.LowPart(item.getAttribute("NoExSort"))) {
				AddEvent("ColumnClick", function (Ctrl, iItem) {
					if (Ctrl.Type <= CTRL_EB) {
						if (Addons.T7Zip.IsHandle(Ctrl)) {
							var cColumns = api.CommandLineToArgv(Ctrl.Columns(1));
							var s = cColumns[iItem * 2];
							if (api.PathMatchSpec(s, "System.ItemNameDisplay;System.DateModified")) {
								var s1 = Ctrl.SortColumns;
								var s2 = 'prop:' + s + ';System.ItemTypeText;';
								var s3 = s2.replace(":", ":-");
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
						if (Addons.T7Zip.IsHandle(Ctrl)) {
							var s1 = Ctrl.SortColumns;
							if (/^prop:\-?System\.ItemNameDisplay;$|^prop:\-?System\.DateModified;$/.test(s1)) {
								setTimeout(function () {
									Ctrl.SortColumns = s1 + 'System.ItemTypeText;';
								}, 99);
							}
						}
					}
				});
			}

			te.AddEvent("GetImage", Addons.T7Zip.DLL.GetImage(api.GetProcAddress(null, "GetImage")));
			te.AddEvent("GetArchive", Addons.T7Zip.DLL.GetArchive);
			return true;
		}
	},

	IsFolder: function (Item) {
		var wfd = api.Memory("WIN32_FIND_DATA");
		api.SHGetDataFromIDList(Item, SHGDFIL_FINDDATA, wfd, wfd.Size);
		return wfd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY;
	},

	Debug: function (s) {
		if (Addons.Debug) {
			Addons.Debug.alert(s);
		} else {
			api.OutputDebugString(s + "\n");
		}
	},

	Finalize: function () {
		if (Addons.T7Zip.DLL) {
			te.RemoveEvent("GetArchive", Addons.T7Zip.DLL.GetArchive);
			te.RemoveEvent("GetImage", Addons.T7Zip.DLL.GetImage);
			delete Addons.T7Zip.DLL;
		}
	}
}
if (window.Addon == 1) {
	AddEvent("Finalize", Addons.T7Zip.Finalize);
	if (Addons.T7Zip.DLL && Addons.T7Zip.Init()) {
		AddEvent("TranslatePath", function (Ctrl, Path) {
			if (Addons.T7Zip.IsHandle(Path)) {
				Ctrl.ENum = Addons.T7Zip.Enum;
				return ssfRESULTSFOLDER;
			}
		}, true);

		AddEvent("BeginDrag", function (Ctrl) {
			if (Addons.T7Zip.IsHandle(Ctrl, "Extract")) {
				var pdwEffect = { 0: DROPEFFECT_COPY | DROPEFFECT_MOVE | DROPEFFECT_LINK };
				api.SHDoDragDrop(Ctrl.hwndView, Ctrl.SelectedItems(), Ctrl, pdwEffect[0], pdwEffect, true);
				return false;
			}
		});

		AddEvent("BeforeGetData", function (Ctrl, Items, nMode) {
			if (!Items.Count) {
				return;
			}
			var root = fso.BuildPath(fso.GetSpecialFolder(2).Path, "tablacus");
			var ar = [];
			for (var i = Items.Count; i--;) {
				var path = Items.Item(i).Path;
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
			var strSessionId = ar[0].substr(root.length + 1, 8);
			var lib = Addons.T7Zip.GetObject(strSessionId == Addons.T7Zip.ClipId ? Addons.T7Zip.ClipPath : Ctrl, "Extract");
			if (lib) {
				var dest = fso.BuildPath(root, strSessionId);
				for (var i = ar.length; i--;) {
					ar[i] = api.PathQuoteSpaces(ar[i].substr(dest.length + 1));
				}
				Addons.T7Zip.CreateFolder(dest);
				Addons.T7Zip.Exec(Ctrl, lib, Addons.T7Zip.Cmd.Extract, dest, ar);
				return S_OK;
			}
		});

		AddEvent("Command", function (Ctrl, hwnd, msg, wParam, lParam) {
			return Addons.T7Zip.Command(Ctrl, wParam & 0xfff);
		}, true);

		AddEvent("InvokeCommand", function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon) {
			return Addons.T7Zip.Command(ContextMenu.FolderView, Verb);
		}, true);

		AddEvent("DefaultCommand", function (Ctrl, Selected) {
			if (Selected.Count == 1) {
				var Item = Selected.Item(0);
				var path = Item.Path;
				if (Addons.T7Zip.IsHandle(path)) {
					Ctrl.Navigate(path);
					return S_OK;
				}
				if (Addons.T7Zip.IsFolder(Item)) {
					var lib = Addons.T7Zip.GetObject(Ctrl);
					if (lib) {
						var root = fso.BuildPath(fso.GetSpecialFolder(2).Path, api.sprintf(99, "tablacus\\%x", Ctrl.SessionId));
						path = path.replace(root, lib.file);
						Ctrl.Navigate(path);
						return S_OK;
					}
				}
			}
		}, true);

		AddEvent("ILGetParent", function (FolderItem) {
			if (Addons.T7Zip.IsHandle(FolderItem)) {
				return fso.GetParentFolderName(FolderItem.Path);
			}
		});

		AddEvent("Context", function (Ctrl, hMenu, nPos, Selected, item, ContextMenu) {
			if (Addons.T7Zip.IsHandle(Ctrl)) {
				RemoveCommand(hMenu, ContextMenu, "rename");
			}
			return nPos;
		});

		AddEvent("DragEnter", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
			if (Ctrl.Type <= CTRL_EB || Ctrl.Type == CTRL_DT) {
				var lib = Addons.T7Zip.GetObject(Ctrl, "Add");
				if (lib) {
					Addons.T7Zip.GetDropEffect(Ctrl, dataObj, pdwEffect);
					return S_OK;
				}
			}
		});

		AddEvent("DragOver", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
			if (Ctrl.Type <= CTRL_EB || Ctrl.Type == CTRL_DT) {
				var lib = Addons.T7Zip.GetObject(Ctrl, "Add");
				if (lib) {
					Addons.T7Zip.GetDropEffect(Ctrl, dataObj, pdwEffect);
					return S_OK;
				}
			}
		});

		AddEvent("Drop", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
			var lib = Addons.T7Zip.GetObject(Ctrl, "Add");
			if (lib) {
				if (Addons.T7Zip.GetDropEffect(Ctrl, dataObj, pdwEffect)) {
					Addons.T7Zip.Append(Ctrl, dataObj);
					return S_OK;
				}
			}
		});

		AddEvent("DragLeave", function (Ctrl) {
			return S_OK;
		});

		AddEvent("AddonDisabled", function (Id) {
			if (Id.toLowerCase() == "t7zip") {
				Addons.T7Zip.Finalize();
			}
		});

		AddEvent("BeforeNavigate", function (Ctrl, fs, wFlags, Prev) {
			if (Ctrl.Type <= CTRL_EB && Addons.T7Zip.IsHandle(Prev)) {
				var root = fso.BuildPath(fso.GetSpecialFolder(2).Path, api.sprintf(99, "tablacus\\%x", Ctrl.SessionId));
				DeleteItem(root);
			}
		});

		AddEvent("BeginLabelEdit", function (Ctrl, Name) {
			if (Ctrl.Type <= CTRL_EB) {
				if (Addons.T7Zip.IsHandle(Ctrl)) {
					return 1;
				}
			}
		});

		AddEvent("ToolTip", function (Ctrl, Index) {
			if (Ctrl.Type <= CTRL_EB) {
				if (Addons.T7Zip.IsHandle(Ctrl)) {
					var Item = Ctrl.Items.Item(Index);
					if (Addons.T7Zip.IsFolder(Item)) {
						var s = FormatDateTime(Item.ModifyDate);
						return s ? api.PSGetDisplayName("Write") + " : " + s : "";
					}
				}
			}
		});
	}

	AddEvent("GetIconImage", function (Ctrl, BGColor, bSimple) {
		var lib = Addons.T7Zip.GetObject(Ctrl);
		if (lib && lib.path) {
			return MakeImgDataEx("icon:shell32.dll,3", bSimple, 16);
		}
	});

} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
