var Addon_Id = "spiplus";
var item = GetAddonElement(Addon_Id);

Addons.SPIPlus =
{
	Cmd: {},
	Filter: item.getAttribute("Filter") || "*",
	Disable: item.getAttribute("Disable") || "*.exe;*.zip;*.msi;*.doc;*.xls;*.ppt;*.chm;*.docx;*.xlsx;*.epub",
	Priority: item.getAttribute("Priority") || "-",
	ExSort: !api.LowPart(item.getAttribute("NoExSort")),

	IsHandle: function (Ctrl, need) {
		return Addons.SPIPlus.GetObject(Ctrl, need) != null;
	},

	GetObject: function (Ctrl, need) {
		if (!Addons.SPI || !Addons.SPI.AM) {
			return;
		}
		var lib = {
			file: "string" === typeof Ctrl ? Ctrl : api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL),
			path: ""
		}
		for (var nDog = 32; /^[A-Z]:\\|^\\\\[A-Z]/i.test(lib.file) && nDog--;) {
			var dw;
			for (var i = 0; i < Addons.SPI.AM.length; i++) {
				var SPI = Addons.SPI.AM[i];
				if (PathMatchEx(lib.file, SPI.Filter)) {
					if (PathMatchEx(lib.file, Addons.SPIPlus.Priority) || (PathMatchEx(lib.file, Addons.SPIPlus.Filter) && !PathMatchEx(lib.file, Addons.SPIPlus.Disable))) {
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
			lib.path = fso.BuildPath(fso.GetFileName(lib.file), lib.path);
			lib.file = fso.GetParentFolderName(lib.file);
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
			switch ("string" === typeof Verb ? Addons.SPIPlus.StringToVerb[Verb.toLowerCase()] : Verb + 1) {
				case CommandID_COPY:
				case CommandID_CUT:
					var lib = Addons.SPIPlus.GetObject(Ctrl, "Extract");
					if (lib) {
						api.OleSetClipboard(Ctrl.SelectedItems());
						Addons.SPIPlus.ClipId = api.sprintf(9, "%x", Ctrl.SessionId);
						Addons.SPIPlus.ClipPath = lib.file;
						return S_OK;
					}
					break;
			}
		}
	},

	Enum: function (pid, Ctrl, fncb, SessionId) {
		var lib = Addons.SPIPlus.GetObject(pid.Path);
		if (lib) {
			var Items = api.CreateObject("FolderItems");
			var Folder = {};
			var Folder2 = {};
			var root = fso.BuildPath(fso.GetSpecialFolder(2).Path, api.sprintf(99, "tablacus\\%x", SessionId));
			var pFileInfo = [];
			lib.SPI.GetArchiveInfo(lib.file, 0, 0, pFileInfo, function () {
				return {};
			});
			for (var i = 0; i < pFileInfo.length; i++) {
				var fn = fso.BuildPath(pFileInfo[i].path, pFileInfo[i].filename).replace(/\//g, "\\");
				var strParent = fso.GetParentFolderName(fn).toLowerCase();
				if (strParent == lib.path.toLowerCase() && pFileInfo[i].filesize) {
					var dwAttr = 0;
					if (/\\$|\/$/.test(fn)) {
						fn = fn.replace(/\\$|\/$/, "");
						dwAttr = FILE_ATTRIBUTE_DIRECTORY;
						Folder[fn] = 1;
					}
					Items.AddItem(api.SHSimpleIDListFromPath(fso.BuildPath(root, fn), dwAttr, pFileInfo[i].timestamp, pFileInfo[i].filesize));
				}
				while (/\\/.test(fn)) {
					fn = fso.GetParentFolderName(fn);
					if (!fn) {
						break;
					}
					Folder2[fn] = 1;
				}
			}
			for (var fn in Folder2) {
				if (!Folder[fn]) {
					var strParent = fso.GetParentFolderName(fn).toLowerCase();
					if (strParent == lib.path.toLowerCase()) {
						Items.AddItem(api.SHSimpleIDListFromPath(fso.BuildPath(root, fn), FILE_ATTRIBUTE_DIRECTORY, new Date(), 0));
					}
				}
			}
			return Items;
		}
	},

	ProgressCallback: function (nNum, nDemon, lData) {
		var info = Addons.SPIPlus.pFileInfo[lData];
		if (info) {
			if (Addons.SPIPlus.Progress) {
				Addons.SPIPlus.ShowProgress(Addons.SPIPlus.SizeCurrent + info.filesize * nNum / Math.max(nDemon, 1), lData + 1);
			}
			return Addons.SPIPlus.Progress.HasUserCancelled() ? 1 : 0;
		}
		return 0;
	},

	ShowProgress: function (nCurrent, i) {
		var points = Math.min(Math.floor(nCurrent * 100 / Addons.SPIPlus.SizeTotal), 100);
		var s3 = 6466, s4 = 6466;
		var t = Addons.SPIPlus.pFileInfo.length;
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
		var sItem = (api.LoadString(hShell32, s3) || "%s items").replace(/%1!ls!|%s/g, i);
		var sTotal = (api.LoadString(hShell32, s3) || "%s items").replace(/%1!ls!|%s/g, t);
		Addons.SPIPlus.Progress.SetTitle(points + "% (" + sItem + ' / ' + sTotal + ')');
		Addons.SPIPlus.Progress.SetProgress(points, 100);
		Addons.SPIPlus.Progress.SetLine(1, [api.LoadString(hShell32, 5954) || api.LoadString(hShell32, 32946), " (", api.StrFormatByteSize(nCurrent), ' / ', api.StrFormatByteSize(Addons.SPIPlus.SizeTotal), ")"].join(""), true);
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

}
if (window.Addon == 1) {
	AddEvent("Load", function ()
	{
		if (Addons.SPI && Addons.SPI.AM && Addons.SPI.AM.length) {
			AddEvent("TranslatePath", function (Ctrl, Path) {
				if (Addons.SPIPlus.IsHandle(Path)) {
					Ctrl.ENum = Addons.SPIPlus.Enum;
					return ssfRESULTSFOLDER;
				}
			}, true);

			AddEvent("BeginDrag", function (Ctrl) {
				if (Addons.SPIPlus.IsHandle(Ctrl, "Extract")) {
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
					var Item = Items.Item(i);
					var path = Item.Path;
					if (api.PathMatchSpec(path, root + "\\*")) {
						if (!fso.FileExists(path)) {
							ar.unshift(Addons.SPIPlus.IsFolder(Item) ? fso.BuildPath(path, "*") : path);
						}
					} else {
						return;
					}
				}
				if (!ar.length) {
					return;
				}
				var strSessionId = ar[0].substr(root.length + 1).replace(/\\.*/, "");
				var lib = Addons.SPIPlus.GetObject(strSessionId == Addons.SPIPlus.ClipId ? Addons.SPIPlus.ClipPath : Ctrl, "Extract");
				if (lib) {
					var hr = S_OK;
					var dest = fso.BuildPath(root, strSessionId);
					var pFileInfo = [];
					lib.SPI.GetArchiveInfo(lib.file, 0, 0, pFileInfo, function () {
						return {};
					});
					Addons.SPIPlus.pFileInfo = [];
					for (var i = 0; i < ar.length; i++) {
						var filter = ar[i].substr(dest.length + 1);
						if (/\\$/.test(filter)) {
							filter += "*";
						}
						for (var j = 0; j < pFileInfo.length; j++) {
							var info = pFileInfo[j];
							var path = fso.BuildPath(info.path, info.filename).replace(/\//g, "\\");
							if (api.PathMatchSpec(path, filter) && !api.PathMatchSpec(path, "*..\\*")) {
								Addons.SPIPlus.pFileInfo.push(info);
							}
						}
					}
					if (!pFileInfo.length) {
						return S_FALSE;
					}
					Addons.SPIPlus.SizeCurrent = 0;
					Addons.SPIPlus.SizeTotal = 0;
					for (var i = 0; i < Addons.SPIPlus.pFileInfo.length; i++) {
						var info = Addons.SPIPlus.pFileInfo[i];
						Addons.SPIPlus.SizeTotal += info.filesize;
					}
					Addons.SPIPlus.Progress = api.CreateObject("ProgressDialog");
					Addons.SPIPlus.Progress.StartProgressDialog(te.hwnd, null, 2);
					try {
						for (var i = 0; i < Addons.SPIPlus.pFileInfo.length; i++) {
							var info = Addons.SPIPlus.pFileInfo[i];
							var path1 = fso.BuildPath(info.path, info.filename).replace(/\//g, "\\");
							var path = fso.BuildPath(dest, path1);
							Addons.SPIPlus.Progress.SetLine(2, path1, true);
							Addons.SPIPlus.ShowProgress(Addons.SPIPlus.SizeCurrent, i + 1);
							Addons.SPIPlus.CreateFolder(fso.GetParentFolderName(path));
							lib.SPI.GetFile(lib.file, info.position, path, 0, Addons.SPIPlus.ProgressCallback, i);
							if (Addons.SPIPlus.Progress.HasUserCancelled()) {
								hr = E_ABORT;
								break;
							}
							api.SetFileTime(path, null, null, info.timestamp);
							Addons.SPIPlus.SizeCurrent += info.filesize;
						}
					} catch (e) {
						ShowError(e, "SPIPlus");
					}
					Addons.SPIPlus.Progress.StopProgressDialog();
					delete Addons.SPIPlus.Progress;
					return hr;
				}
			});

			AddEvent("Command", function (Ctrl, hwnd, msg, wParam, lParam) {
				return Addons.SPIPlus.Command(Ctrl, wParam & 0xfff);
			}, true);

			AddEvent("InvokeCommand", function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon) {
				return Addons.SPIPlus.Command(ContextMenu.FolderView, Verb);
			}, true);

			AddEvent("DefaultCommand", function (Ctrl, Selected) {
				if (Selected.Count == 1) {
					var Item = Selected.Item(0);
					var path = Item.Path;
					if (Addons.SPIPlus.IsHandle(path)) {
						Ctrl.Navigate(path);
						return S_OK;
					}
					if (Addons.SPIPlus.IsFolder(Item)) {
						var lib = Addons.SPIPlus.GetObject(Ctrl);
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
				if (Addons.SPIPlus.IsHandle(FolderItem)) {
					return fso.GetParentFolderName(FolderItem.Path);
				}
			});

			AddEvent("Context", function (Ctrl, hMenu, nPos, Selected, item, ContextMenu) {
				if (Addons.SPIPlus.IsHandle(Ctrl)) {
					RemoveCommand(hMenu, ContextMenu, "rename");
				}
				return nPos;
			});

			AddEvent("BeforeNavigate", function (Ctrl, fs, wFlags, Prev) {
				if (Ctrl.Type <= CTRL_EB && Addons.SPIPlus.IsHandle(Prev)) {
					var root = fso.BuildPath(fso.GetSpecialFolder(2).Path, api.sprintf(99, "tablacus\\%x", Ctrl.SessionId));
					DeleteItem(root);
				}
			});

			AddEvent("BeginLabelEdit", function (Ctrl, Name) {
				if (Ctrl.Type <= CTRL_EB) {
					if (Addons.SPIPlus.IsHandle(Ctrl)) {
						return 1;
					}
				}
			});

			AddEvent("ToolTip", function (Ctrl, Index) {
				if (Ctrl.Type <= CTRL_EB) {
					if (Addons.SPIPlus.IsHandle(Ctrl)) {
						var Item = Ctrl.Items.Item(Index);
						if (Addons.SPIPlus.IsFolder(Item)) {
							var s = FormatDateTime(Item.ModifyDate);
							return s ? api.PSGetDisplayName("Write") + " : " + s : "";
						}
					}
				}
			});
		}

		AddEvent("GetIconImage", function (Ctrl, BGColor, bSimple) {
			var lib = Addons.SPIPlus.GetObject(Ctrl);
			if (lib && lib.path) {
				return MakeImgDataEx("icon:shell32.dll,3", bSimple, 16);
			}
		});

		if (Addons.SPIPlus.ExSort) {
			AddEvent("Sort", function (Ctrl) {
				if (Ctrl.Type <= CTRL_EB) {
					if (Addons.SPIPlus.IsHandle(Ctrl)) {
						var s1 = Ctrl.SortColumns;
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
					if (Addons.SPIPlus.IsHandle(Ctrl)) {
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
		}
	});
} else {
	var ado = OpenAdodbFromTextFile("addons\\" + Addon_Id + "\\options.html", "utf-8");
	if (ado) {
		SetTabContents(0, "", ado.ReadText(adReadAll));
		ado.Close();
	}
}
