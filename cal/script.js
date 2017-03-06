var Addon_Id = "cal";
var item = GetAddonElement(Addon_Id);

Addons.CAL =
{
	tid: [],

	IsHandle: function (Ctrl, need)
	{
		return Addons.CAL.GetObject(Ctrl, need) != null;
	},

	GetObject: function (Ctrl, need)
	{
		if (!Addons.CAL.DLL) {
			return;
		}
		var lib = {
			file: typeof(Ctrl) == "string" ? Ctrl : api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING),
			path: ""
		}
		if (!Addons.CAL.Obj) {
			Addons.CAL.Init();
		}
		var nDog = 32;
		var items = Addons.CAL.xml.getElementsByTagName("Item");
		while (/^[A-Z]:\\|^\\\\[A-Z]/i.test(lib.file) && nDog--) {
			for (var i in Addons.CAL.Obj) {
				var item = Addons.CAL.Obj[i];
				if (item.Filter && api.PathMatchSpec(lib.file, item.Filter)) {
					if (!need || item[need]) {
						if ((item.X.CheckArchive && item.X.CheckArchive(lib.file, 0) !== false) ||
						(item[need] && need != "wait" && item.X.Exec)) {
							for (var j in item) {
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
			lib.path = fso.BuildPath(fso.GetFileName(lib.file), lib.path);
			lib.file = fso.GetParentFolderName(lib.file);
		};
	},

	Init: function ()
	{
		Addons.CAL.Obj = [];
		var items = Addons.CAL.xml.getElementsByTagName("Item");
		for (var i = 0; i < items.length; i++) {
			var item = items[i];
			var dllPath = ExtractMacro(te, item.getAttribute("Path").replace(/\*/g, api.sizeof("HANDLE") * 8));
			var procName = item.getAttribute("Name").replace(/\W.*$/, "");
			if (/\.exe"?\s*/i.test(dllPath)) {
				CAL = Addons.CAL.OpenExe(dllPath);
			} else {
				CAL = Addons.CAL.DLL.open(dllPath, procName);
			}
			if (!CAL && api.sizeof("HANDLE") == 8 && /UNLHA[36][24].DLL$|UNZIP[36][24].DLL$|ZIP[36][24]J\.DLL$|TAR[36][24]\.DLL$|CAB[36][24]\.DLL$|UNRAR[36][24]\.DLL$|7\-ZIP[36][24]\.DLL$/i.test(dllPath)) {
				CAL = Addons.CAL.DLL.open(dllPath.replace(/[^\\]*\.dll$/, "UNBYPASS.DLL"), procName);
			}
			if (CAL && CAL.Exec) {
				Addons.CAL.Obj.push({
					X: CAL,
					Filter: item.getAttribute("Filter"),
					Extract: item.getAttribute("Extract"),
					Add: item.getAttribute("Add"),
					Delete: item.getAttribute("Delete"),
					Name: procName,
					wait: 1
				});
			}
		}
	},

	Refresh: function (Ctrl)
	{
		Ctrl.Refresh();
	},

	Exec: function (Ctrl, lib, strCmd, strPath, arList, bRefresh, arFull)
	{
		strCmd = strCmd.replace(/%archive%/i, api.PathQuoteSpaces(lib.file));
		strCmd = strCmd.replace(/%base%/i, lib.path);
		if (/%path%/i.test(strCmd)) {
			strCmd = strCmd.replace(/%path%/i, strPath);
		} else if (arFull) {
			strCmd = strCmd.replace(/%items%/i, arFull.join(" "));
		}
		strCmd = strCmd.replace(/%items%/i, arList.join(" "));
		var pszOut = [];
		var r = lib.X.Exec(te.hwnd, strCmd, pszOut, 30000);
		if (r) {
			if (pszOut[0]) {
				MessageBox(strCmd + "\n" + pszOut[0].replace(/^\s*/, ""), TITLE, MB_OK);
			}
		} else if (bRefresh) {
			Addons.CAL.Refresh(Ctrl);
		}
		if (Addons.Debug) {
			Addons.Debug.alert(lib.Name + " " + strCmd);
			Addons.Debug.alert(pszOut[0]);
		} else {
			api.OutputDebugString(lib.Name + " " + strCmd);
			api.OutputDebugString(pszOut[0]);
		}
		return r;
	},

	StringToVerb: {
		"paste" : CommandID_PASTE,
		"delete": CommandID_DELETE,
		"copy": CommandID_COPY,
		"cut": CommandID_CUT,
		"properties": CommandID_PROPERTIES,
	},

	Command: function (Ctrl, Verb)
	{
		if (Ctrl && Ctrl.Type <= CTRL_EB) {
			switch (typeof(Verb) == "string" ? Addons.CAL.StringToVerb[Verb.toLowerCase()] : Verb + 1) {
				case CommandID_PASTE:
					if (Addons.CAL.Append(Ctrl, api.OleGetClipboard())) {
						return S_OK;
					}
					break;
				case CommandID_DELETE:
					if (Addons.CAL.Delete(Ctrl)) {
						return S_OK;
					}
					break;
				case CommandID_COPY:
				case CommandID_CUT:
					var lib = Addons.CAL.GetObject(Ctrl, "Extract");
					if (lib) {
						api.OleSetClipboard(Ctrl.SelectedItems());
						Addons.CAL.ClipId = api.sprintf(9, "%x", Ctrl.SessionId);
						Addons.CAL.ClipPath = lib.file;
						return S_OK;
					}
					break;
			}
		}
	},

	Append: function (Ctrl, Items)
	{
		if (!Items.Count) {
			return;
		}
		var lib = Addons.CAL.GetObject(Ctrl, "Add");
		if (lib) {
			var ar = [], arFull = [], root;
			if (lib.path) {
				root = fso.BuildPath(fso.GetSpecialFolder(2).Path, api.sprintf(99, "tablacus\\%x", Ctrl.SessionId));
				var path = fso.BuildPath(root, lib.path);
				DeleteItem(path);
				Addons.CAL.CreateFolder(path);
				var oDest = sha.NameSpace(path);
				if (oDest) {
					oDest.CopyHere(Items, FOF_NOCONFIRMATION | FOF_NOCONFIRMMKDIR);
					ar.push(lib.path);
					arFull.push(path);
				}
			} else {
				root = Items.Item(-1).Path;
				for (var i = Items.Count; i-- > 0;) {
					var Item = Items.Item(i);
					ar.unshift(api.PathQuoteSpaces(Item.Path.replace(root, "").replace(/^\\/, "")));
					arFull.unshift(api.PathQuoteSpaces(Item.Path));
				}
			}
			Addons.CAL.Exec(Ctrl, lib, lib.Add, root, ar, true, arFull);
			return true;
		}
	},

	Delete: function (Ctrl)
	{
		var Items = Ctrl.SelectedItems();
		if (!Items.Count) {
			return;
		}
		var lib = Addons.CAL.GetObject(Ctrl, "Delete");
		if (lib) {
			if (!confirmOk("Are you sure?")) {
				return;
			}
			var root = fso.BuildPath(fso.GetSpecialFolder(2).Path, api.sprintf(99, "tablacus\\%x", Ctrl.SessionId));
			var ar = [];
			for (var i = Items.Count; i-- > 0;) {
				ar.unshift(api.PathQuoteSpaces(Items.Item(i).Path.replace(root, "").replace(/^\\/, "")));
			}
			Addons.CAL.Exec(Ctrl, lib, lib.Delete, root, ar, true);
			return true;
		}
	},

	Navigate: function (Ctrl)
	{
		if (!Ctrl || !Ctrl.FolderItem) {
			return;
		}
		var path = Ctrl.FolderItem.Path;
		var lib = Addons.CAL.GetObject(path, "wait");
		if (lib) {
			Ctrl.SortColumn = "";
			clearTimeout(Addons.CAL.tid[Ctrl.Id]);
			Addons.CAL.tid[Ctrl.Id] = setTimeout(function ()
			{
				delete Addons.CAL.tid[Ctrl.Id];
				Ctrl.RemoveAll();
				var root = fso.BuildPath(fso.GetSpecialFolder(2).Path, api.sprintf(99,"tablacus\\%x", Ctrl.SessionId));
				var harc = lib.X.OpenArchive(te.hwnd, lib.file, 1);
				if (harc) {
					var info = {};
					var iFind = lib.X.FindFirst(harc, "", info);
					var Folder = {}, Folder2 = {};
					while (iFind == 0) {
						var fn = info.szFileName.replace(/\//g, "\\");
						if (/\.\.\\|:/.test(fn)) {
							continue;
						}
						var strParent = fso.GetParentFolderName(fn).toLowerCase();
						if (strParent == lib.path.toLowerCase()) {
							var dwAttr = 0;
							if (/\\$/.test(fn)) {
								dwAttr = FILE_ATTRIBUTE_DIRECTORY;
								Folder[fn.replace(/\\$/, "")] = 1;
							}
							Ctrl.AddItem(api.SHSimpleIDListFromPath(fso.BuildPath(root, fn), dwAttr, info.DateTime, info.dwOriginalSize));
						}
						while (/[\\|\/]/.test(fn)) {
							fn = fso.GetParentFolderName(fn);
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
							var strParent = fso.GetParentFolderName(fn).toLowerCase();
							if (strParent == lib.path.toLowerCase()) {
								var pidl = api.SHSimpleIDListFromPath(fso.BuildPath(root, fn), FILE_ATTRIBUTE_DIRECTORY, new Date(), 0);
								Ctrl.AddItem(pidl);
							}
						}
					}
				}
			}, 500);
		} else if (lib && lib.busy) {
			setTimeout(function ()
			{
				Addons.CAL.Navigate(Ctrl);
			}, 500);
		}
	},

	OpenExe: function (path)
	{
		return {
			EXE: path,

			Exec: function (hwnd, strCmd, szOutput)
			{
				var oExec = wsh.Exec(this.EXE + ' ' + strCmd);
				while (!oExec.Status) {
					api.Sleep(100);
				}
				szOutput[0] = oExec.StdOut.ReadAll();
				return (oExec.ExitCode);
			},

			GetRunning: function ()
			{
				return false;
			}

		};
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

	Finalize: function ()
	{
		delete Addons.CAL.Obj;
		CollectGarbage();
		delete Addons.CAL.DLL;
	}
}
if (window.Addon == 1) {
	var bit = String(api.sizeof("HANDLE") * 8);
	Addons.CAL.DLL = api.DllGetClassObject(fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), "addons\\cal\\tcal" + bit + '.dll'), "{D45DF22D-DA6A-406b-8C1E-5A6642B5BEE3}");
	Addons.CAL.xml = OpenXml("cal.xml", false, true);

	AddEvent("Finalize", Addons.CAL.Finalize);

	AddEvent("TranslatePath", function (Ctrl, Path)
	{
		if (Addons.CAL.IsHandle(Path)) {
			return ssfRESULTSFOLDER;
		}
	}, true);

	AddEvent("NavigateComplete", Addons.CAL.Navigate);

	AddEvent("BeginDrag", function (Ctrl)
	{
		if (Addons.CAL.IsHandle(Ctrl, "Extract")) {
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
			if (!api.StrCmpNI(root, path, root.length) && !IsExists(path)) {
				ar.unshift(path);
			}
		}
		if (!ar.length) {
			return;
		}
		var strSessionId = fso.GetParentFolderName(ar[0]).replace(root + "\\", "").replace(/\\.*/, "");
		var lib = Addons.CAL.GetObject(strSessionId == Addons.CAL.ClipId ? Addons.CAL.ClipPath : Ctrl, "Extract");
		if (lib) {
			var dest = fso.BuildPath(root, strSessionId);
			for (var i = ar.length; i--;) {
				ar[i] = api.PathQuoteSpaces(ar[i].replace(dest, "").replace(/^\\/, ""));
			}
			Addons.CAL.CreateFolder(dest);
			Addons.CAL.Exec(Ctrl, lib, lib.Extract, dest, ar);
		}
	});

	AddEvent("Command", function (Ctrl, hwnd, msg, wParam, lParam)
	{
		var hr = Addons.CAL.Command(Ctrl, wParam & 0xfff);
		if (isFinite(hr)) {
			return hr;
		}
	}, true);

	AddEvent("InvokeCommand", function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon)
	{
		var hr = Addons.CAL.Command(ContextMenu.FolderView, Verb);
		if (isFinite(hr)) {
			return hr;
		}
	}, true);

	AddEvent("DefaultCommand", function (Ctrl, Selected)
	{
		if (Selected.Count == 1) {
			var path = api.GetDisplayNameOf(Selected.Item(0), SHGDN_FORPARSING | SHGDN_FORADDRESSBAR);
			if (Addons.CAL.IsHandle(path)) {
				Ctrl.Navigate(path);
				return S_OK;
			}
			if (Selected.Item(0).IsFolder) {
				var lib = Addons.CAL.GetObject(Ctrl);
				if (lib) {
					var root = fso.BuildPath(fso.GetSpecialFolder(2).Path, api.sprintf(99,"tablacus\\%x", Ctrl.SessionId));
					path = path.replace(root, lib.file);
					Ctrl.Navigate(path);
					return S_OK;
				}
			}
		}
	}, true);

	AddEvent("ILGetParent", function (FolderItem)
	{
		var path = FolderItem.Path;
		if (Addons.CAL.IsHandle(path)) {
			return fso.GetParentFolderName(path);
		}
	});

	AddEvent("Context", function (Ctrl, hMenu, nPos, Selected, item, ContextMenu)
	{
		var path = api.GetDisplayNameOf(Ctrl.FolderItem, SHGDN_FORPARSING | SHGDN_FORADDRESSBAR);
		if (Addons.CAL.IsHandle(path)) {
			RemoveCommand(hMenu, ContextMenu, "rename");
		}
		return nPos;
	});

	AddEvent("DragEnter", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		if (Ctrl.Type <= CTRL_EB || Ctrl.Type == CTRL_DT) {
			var lib = Addons.CAL.GetObject(Ctrl, "Add");
			if (lib) {
				return S_OK;
			}
		}
	});

	AddEvent("DragOver", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		if (Ctrl.Type <= CTRL_EB || Ctrl.Type == CTRL_DT) {
			var lib = Addons.CAL.GetObject(Ctrl, "Add");
			if (lib) {
				pdwEffect[0] = DROPEFFECT_COPY;
				return S_OK;
			}
		}
	});

	AddEvent("Drop", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		var lib = Addons.CAL.GetObject(Ctrl, "Add");
		if (lib) {
			Addons.CAL.Append(Ctrl, dataObj);
			return S_OK;
		}
	});

	AddEvent("DragLeave", function (Ctrl)
	{
		return S_OK;
	});

	AddEvent("AddonDisabled", function (Id)
	{
		if (Id.toLowerCase() == "cal") {
			Addons.CAL.Finalize();
		}
	});

	AddEvent("BeforeNavigate", function (Ctrl, fs, wFlags, Prev)
	{
		if (Ctrl.Type <= CTRL_EB && Addons.CAL.IsHandle(Prev)) {
			var root = fso.BuildPath(fso.GetSpecialFolder(2).Path, api.sprintf(99,"tablacus\\%x", Ctrl.SessionId));
			DeleteItem(root);
		}
	});

	AddEvent("BeginLabelEdit", function (Ctrl, Name)
	{
		if (Ctrl.Type <= CTRL_EB) {
			if (Addons.CAL.IsHandle(Ctrl)) {
				return 1;
			}
		}
	});

	AddEvent("ToolTip", function (Ctrl, Index)
	{
		if (Ctrl.Type <= CTRL_EB) {
			if (Addons.CAL.IsHandle(Ctrl)) {
				var Item = Ctrl.Items.Item(Index);
				if (Item.IsFolder) {
					var s = FormatDateTime(Item.ModifyDate);
					return s ? api.PSGetDisplayName("Write") + " : " + s : "";
				}
			}
		}
	});
}
