Addon_Id = "cal";

var items = te.Data.Addons.getElementsByTagName(Addon_Id);
var item = items.length ? items[0] : null;

Addons.CAL =
{
	tid: [],

	Init: function (item)
	{
	},

	IsHandle: function (Ctrl, need)
	{
		return Addons.CAL.GetObject(Ctrl, {}, need) != null;
	},

	GetObject: function (Ctrl, dir, need)
	{
		if (!Addons.CAL.DLL) {
			return;
		}
		dir.file = typeof(Ctrl) == "string" ? Ctrl : api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
		dir.path = "";
		var nDog = 32;
		var items = Addons.CAL.xml.getElementsByTagName("Item");
		while (/^[A-Z]:\\|^\\/i.test(dir.file) && nDog--) {
			var CAL = null;
			for (var i = 0; i < items.length; i++) {
				var item = items[i];
				var filter = item.getAttribute("Filter");
				if (filter && api.PathMatchSpec(dir.file, filter)) {
					if (!need || item.getAttribute(need)) {
						var dllPath = ExtractMacro(te, item.getAttribute("Path").replace(/\*/g, api.sizeof("HANDLE") * 8));
						var procName = item.getAttribute("Name").replace(/\W.*$/, "");
						if (need && /\.exe"?\s*/i.test(dllPath)) {
							CAL = Addons.CAL.OpenExe(dllPath);
						} else {
							CAL = Addons.CAL.DLL.open(dllPath, procName);
						}
						if (!CAL && api.sizeof("HANDLE") == 8 && /UNLHA[36][24].DLL$|UNZIP[36][24].DLL$|ZIP[36][24]J\.DLL$|TAR[36][24]\.DLL$|CAB[36][24]\.DLL$|UNRAR[36][24]\.DLL$|7\-ZIP[36][24]\.DLL$/i.test(dllPath)) {
							CAL = Addons.CAL.DLL.open(dllPath.replace(/[^\\]*\.dll$/, "UNBYPASS.DLL"), procName);
						}
						if (CAL) {
							if (need || CAL.OpenArchive) {
								if (CAL.CheckArchive(dir.file, 0) !== false) {
									dir.Extract = item.getAttribute("Extract");
									dir.Add = item.getAttribute("Add");
									dir.Delete = item.getAttribute("Delete");
									return CAL;
								}
								if (CAL.GetRunning()) {
									dir.busy = true;
									return;
								}
							}
						}
					}
				}
			}
			dir.path = fso.BuildPath(fso.GetFileName(dir.file), dir.path);
			dir.file = fso.GetParentFolderName(dir.file);
		};
	},

	Refresh: function (Ctrl)
	{
		Ctrl.Refresh();
	},

	Exec: function (Ctrl, CAL, dir, strCmd, strPath, arList, bRefresh, arFull)
	{
		strCmd = strCmd.replace(/%archive%/i, api.PathQuoteSpaces(dir.file));
		strCmd = strCmd.replace(/%base%/i, dir.path);
		if (/%path%/i.test(strCmd)) {
			strCmd = strCmd.replace(/%path%/i, strPath);
		} else if (arFull) {
			strCmd = strCmd.replace(/%items%/i, arFull.join(" "));
		}
		strCmd = strCmd.replace(/%items%/i, arList.join(" "));
		var szOutput = [];
		var r = CAL.Exec(te.hwnd, strCmd, szOutput, 30000);
		if (r) {
			if (szOutput[0]) {
				MessageBox(strCmd + "\n" + szOutput[0].replace(/^\s*/, ""), TITLE, MB_OK);
			}
		} else if (bRefresh) {
			Addons.CAL.Refresh(Ctrl);
		}
		if (Addons.Debug) {
			Addons.Debug.alert(strCmd);
			Addons.Debug.alert(szOutput[0]);
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
					var dir = {};
					if (Addons.CAL.GetObject(Ctrl, dir, "Extract")) {
						api.OleSetClipboard(Ctrl.SelectedItems());
						Addons.CAL.ClipId = api.sprintf(9, "%x", Ctrl.SessionId);
						Addons.CAL.ClipPath = dir.file;
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
		var dir = {};
		var CAL = Addons.CAL.GetObject(Ctrl, dir, "Add");
		if (CAL) {
			var ar = [], arFull = [], root;
			if (dir.path) {
				root = fso.BuildPath(fso.GetSpecialFolder(2).Path, api.sprintf(99, "tablacus\\%x", Ctrl.SessionId));
				var path = fso.BuildPath(root, dir.path);
				DeleteItem(path);
				Addons.CAL.CreateFolder(path);
				var oDest = sha.NameSpace(path);
				if (oDest) {
					oDest.CopyHere(Items, FOF_NOCONFIRMATION | FOF_NOCONFIRMMKDIR);
					ar.push(dir.path);
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
			Addons.CAL.Exec(Ctrl, CAL, dir, dir.Add, root, ar, true, arFull);
			return true;
		}
	},

	Delete: function (Ctrl)
	{
		var Items = Ctrl.SelectedItems();
		if (!Items.Count) {
			return;
		}
		var dir = {};
		var CAL = Addons.CAL.GetObject(Ctrl, dir, "Delete");
		if (CAL) {
			if (!confirmOk("Are you sure?")) {
				return;
			}
			var root = fso.BuildPath(fso.GetSpecialFolder(2).Path, api.sprintf(99, "tablacus\\%x", Ctrl.SessionId));
			var ar = [];
			for (var i = Items.Count; i-- > 0;) {
				ar.unshift(api.PathQuoteSpaces(Items.Item(i).Path.replace(root, "").replace(/^\\/, "")));
			}
			Addons.CAL.Exec(Ctrl, CAL, dir, dir.Delete, root, ar, true);
			return true;
		}
	},

	Navigate: function (Ctrl)
	{
		var path = Ctrl.FolderItem.Path;
		var dir = {};
		var CAL = Addons.CAL.GetObject(path, dir);
		if (CAL) {
			Ctrl.SortColumn = "";
			clearTimeout(Addons.CAL.tid[Ctrl.Id]); 
			Addons.CAL.tid[Ctrl.Id] = setTimeout(function ()
			{
				delete Addons.CAL.tid[Ctrl.Id];
				Ctrl.RemoveAll();
				var root = fso.BuildPath(fso.GetSpecialFolder(2).Path, api.sprintf(99,"tablacus\\%x", Ctrl.SessionId));
				var harc = CAL.OpenArchive(te.hwnd, dir.file, 1);
				if (harc) {
					var info = {};
					var iFind = CAL.FindFirst(harc, "", info);
					var Folder = {}, Folder2 = {};
					while (iFind == 0) {
						var fn = info.szFileName.replace(/\//g, "\\");
						if (/\.\.\\|:/.test(fn)) {
							continue;
						}
						var strParent = fso.GetParentFolderName(fn).toLowerCase();
						if (strParent == dir.path.toLowerCase()) {
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
						iFind = CAL.FindNext(harc, info);
					}
					CAL.CloseArchive(harc);
					for (fn in Folder2) {
						if (!Folder[fn]) {
							var strParent = fso.GetParentFolderName(fn).toLowerCase();
							if (strParent == dir.path.toLowerCase()) {
								var pidl = api.SHSimpleIDListFromPath(fso.BuildPath(root, fn), FILE_ATTRIBUTE_DIRECTORY, new Date(), 0);
								Ctrl.AddItem(pidl);
							}
						}
					}
				}
			}, 500);
		} else if (dir.busy) {
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

			CheckArchive: function ()
			{
				return true;
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
		Addons.CAL.DLL = null;
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
		dir = {};
		var CAL = Addons.CAL.GetObject(strSessionId == Addons.CAL.ClipId ? Addons.CAL.ClipPath : Ctrl, dir, "Extract");
		if (CAL) {
			var dest = fso.BuildPath(root, strSessionId);
			for (var i = ar.length; i--;) {
				ar[i] = api.PathQuoteSpaces(ar[i].replace(dest, "").replace(/^\\/, ""));
			}
			Addons.CAL.CreateFolder(dest);
			Addons.CAL.Exec(Ctrl, CAL, dir, dir.Extract, dest, ar);
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
				var dir = {};
				if (Addons.CAL.GetObject(Ctrl, dir)) {
					var root = fso.BuildPath(fso.GetSpecialFolder(2).Path, api.sprintf(99,"tablacus\\%x", Ctrl.SessionId));
					path = path.replace(root, dir.file);
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
			if (Addons.CAL.GetObject(Ctrl, {}, "Add")) {
				return S_OK;
			}
		}
	});

	AddEvent("DragOver", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		if (Ctrl.Type <= CTRL_EB || Ctrl.Type == CTRL_DT) {
			if (Addons.CAL.GetObject(Ctrl, {}, "Add")) {
				pdwEffect[0] = DROPEFFECT_COPY;
				return S_OK;
			}
		}
	});

	AddEvent("Drop", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		if (Addons.CAL.GetObject(Ctrl, {}, "Add")) {
			Addons.CAL.Append(Ctrl, dataObj);
			return S_OK;
		}
	});

	AddEvent("DragLeave", function (Ctrl)
	{
		return S_OK;
	});

	AddEventId("AddonDisabledEx", "cal", Addons.CAL.Finalize);

	AddEvent("BeforeNavigate", function (Ctrl, fs, wFlags, Prev)
	{
		if (Ctrl.Type <= CTRL_EB && Addons.CAL.IsHandle(Prev)) {
			var root = fso.BuildPath(fso.GetSpecialFolder(2).Path, api.sprintf(99,"tablacus\\%x", Ctrl.SessionId));
			DeleteItem(root);
		}
	});
}
