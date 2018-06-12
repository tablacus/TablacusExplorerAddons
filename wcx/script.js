var Addon_Id = "wcx";
var item = GetAddonElement(Addon_Id);

Addons.WCX =
{
	xml: OpenXml("wcx.xml", false, true),

	IsHandle: function (Ctrl)
	{
		return Addons.WCX.GetObject(Ctrl) != null;
	},

	GetObject: function (Ctrl)
	{
		if (!Addons.WCX.DLL) {
			return;
		}
		var lib = {
			file: typeof(Ctrl) == "string" ? Ctrl : api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL),
			path: ""
		}
		if (!Addons.WCX.Obj) {
			Addons.WCX.Init();
		}
		var nDog = 32;
		while (/^[A-Z]:\\|^\\\\[A-Z]/i.test(lib.file) && nDog--) {
			for (var i in Addons.WCX.Obj) {
				var item = Addons.WCX.Obj[i];
				if (api.PathMatchSpec(lib.file, item.filter)) {
					if (item.X.CanYouHandleThisFile(lib.file)) {
						lib.X = item.X;
						return lib;
					}
				}
			}
			lib.path = fso.BuildPath(fso.GetFileName(lib.file), lib.path);
			lib.file = fso.GetParentFolderName(lib.file);
		}
	},

	Init: function ()
	{
		Addons.WCX.Obj = [];
		var items = Addons.WCX.xml.getElementsByTagName("Item");
		for (var i = 0; i < items.length; i++) {
			var item = items[i];
			var filter = item.getAttribute("Filter");
			var dllPath = (ExtractMacro(te, api.PathUnquoteSpaces(item.getAttribute("Path"))) + (api.sizeof("HANDLE") > 4 ? "64" : "")).replace(/\.u(wcx64)$/, ".$1");
			var WCX = Addons.WCX.DLL.open(dllPath);
			if (WCX && WCX.OpenArchive) {
				Addons.WCX.Obj.push({ X: WCX, filter: filter});
				WCX.PackSetDefaultParams(fso.BuildPath(te.Data.DataFolder, "config\\pkplugin.ini"));
				WCX.SetChangeVolProc(-1, Addons.WCX.ChangeVolProc);
				WCX.SetProcessDataProc(-1, Addons.WCX.ProcessDataProc);
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

	Command: function (Ctrl, Verb)
	{
		if (Ctrl && Ctrl.Type <= CTRL_EB && Addons.WCX.IsHandle(Ctrl)) {
			switch (typeof(Verb) == "string" ? Addons.WCX.StringToVerb[Verb.toLowerCase()] : Verb + 1) {
				case CommandID_PASTE:
					Addons.WCX.Append(Ctrl, api.OleGetClipboard());
					return S_OK;
				case CommandID_DELETE:
					Addons.WCX.Delete(Ctrl);
					return S_OK;
				case CommandID_COPY:
				case CommandID_CUT:
					var lib = Addons.WCX.GetObject(Ctrl);
					if (lib) {
						api.OleSetClipboard(Ctrl.SelectedItems());
						Addons.WCX.ClipId = api.sprintf(9, "%x", Ctrl.SessionId);
						Addons.WCX.ClipPath = lib.file;
						return S_OK;
					}
			}
		}
	},

	LocalList: function (Items, fl, nLevel)
	{
		for (var i = 0; i < Items.Count; i++) {
			if (Addons.WCX.Progress.HasUserCancelled()) {
				return 1;
			}
			var Item = Items.Item(i);
			if (IsFolderEx(Item)) {
				if (this.LocalList(Item.GetFolder.Items(), fl, nLevel + 1)) {
					return 1;
				}
				continue;
			}
			fl.push(Item.Path.split(/\\/).slice(-nLevel).join("\\"));
			Addons.WCX.SizeTotal += Item.ExtendedProperty("size");
		}
		return 0;
	},

	ArcList: function (lib, fh, sh)
	{
		var OpenData = {
			ArcName: lib.file,
			OpenMode: 0
		}
		var harc = lib.X.OpenArchive(OpenData);
		if (harc) {
			var nlp = lib.path ? lib.path.split(/\\/).length : 0;
			do {
				if (Addons.WCX.Progress.HasUserCancelled()) {
					return 1;
				}
				var info = {};
				if (lib.X.ReadHeaderEx(harc, info)) {
					break;
				}
				var fn = info.FileName.replace(/\//g, "\\");;
				if (!/\.\.\\|:/.test(fn)) {
					var ar = fn.split(/\\/);
					if (api.StrCmpI(ar.slice(0, nlp).join("\\"), lib.path) == 0) {
						var fn1 = String(ar[nlp]).toLowerCase();
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

	Append: function (Ctrl, Items)
	{
		if (!Items.Count) {
			return;
		}
		var lib = Addons.WCX.GetObject(Ctrl);
		if (lib && lib.X.PackFiles) {
			var fl = [];
			var root = Items.Item(-1).Path;
			Addons.WCX.SizeCurrent = 0;
			Addons.WCX.SizeTotal = 0;
			Addons.WCX.Progress = te.ProgressDialog;
			Addons.WCX.Progress.StartProgressDialog(te.hwnd, null, 2);
			try {
				Addons.WCX.Progress.SetLine(1, api.LoadString(hShell32, 33260) || api.LoadString(hShell32, 6478), true);
				if (!Addons.WCX.LocalList(Items, fl, 1)) {
					Addons.WCX.ShowLine(5954, 32946, fl.length);
					fl.push("");
					if (lib.X.PackFiles(lib.file, lib.path, root + "\\", fl.join("\0"), 0) == 0) {
						Addons.WCX.Refresh(Ctrl);
					}
				}
			} catch (e) {}
			Addons.WCX.Progress.StopProgressDialog();
			delete Addons.WCX.Progress;
		}
	},

	Delete: function (Ctrl)
	{
		var Items = Ctrl.SelectedItems();
		if (!Items.Count || !confirmOk("Are you sure?")) {
			return;
		}
		var lib = Addons.WCX.GetObject(Ctrl.FolderItem.Path);
		if (lib && lib.X.DeleteFiles) {
			var root = fso.BuildPath(fso.GetSpecialFolder(2).Path, api.sprintf(99, "tablacus\\%x", Ctrl.SessionId));
			var fl = [], fh = {}, sh = {};
			Addons.WCX.SizeCurrent = 0;
			Addons.WCX.SizeTotal = 0;
			Addons.WCX.Progress = te.ProgressDialog;
			Addons.WCX.Progress.StartProgressDialog(te.hwnd, null, 2);
			try {
				Addons.WCX.Progress.SetLine(1, api.LoadString(hShell32, 33269) || api.LoadString(hShell32, 6478), true);
				Addons.WCX.ArcList(lib, fh, sh);
				for (var i = 0; i < Items.Count; i++) {
					var Item = Items.Item(i);
					var fn = fso.GetFileName(Item.Path).toLowerCase();
					var o = fh[fn];
					for (var j in o) {
						fl.push(o[j]);
					}
					Addons.WCX.SizeTotal += sh[fn];
				}
				Addons.WCX.ShowLine(5955, 32947, fl.length);
				fl.push("");
				if (lib.X.DeleteFiles(lib.file, fl.join("\0")) == 0) {
					Addons.WCX.Refresh(Ctrl);
				}
			} catch (e) {}
			Addons.WCX.Progress.StopProgressDialog();
			delete Addons.WCX.Progress;
		}
	},

	Enum: function (pid, Ctrl, fncb)
	{
		var lib = Addons.WCX.GetObject(pid.Path);
		if (Ctrl && lib) {
			var Items = te.FolderItems();
			var root = fso.BuildPath(fso.GetSpecialFolder(2).Path, api.sprintf(99,"tablacus\\%x", Ctrl.SessionId));
			var OpenData = {
				ArcName: lib.file,
				OpenMode: 0
			}
			var harc = lib.X.OpenArchive(OpenData);
			if (harc) {
				var Folder = {}, Folder2 = {};
				do {
					var info = {};
					if (lib.X.ReadHeaderEx(harc, info)) {
						break;
					}
					var fn = info.FileName.replace(/\//g, "\\");
					if (/\.\.\\|:/.test(fn)) {
						continue;
					}
					var strParent = fso.GetParentFolderName(fn).toLowerCase();
					if (strParent == lib.path.toLowerCase()) {
						if (info.FileAttr & FILE_ATTRIBUTE_DIRECTORY) {
							Folder[fn.replace(/\\$/, "")] = 1;
						}
						Items.AddItem(api.SHSimpleIDListFromPath(fso.BuildPath(root, fn), info.FileAttr, info.FileTime, info.UnpSize));
					}
					while (/[\\|\/]/.test(fn)) {
						fn = fso.GetParentFolderName(fn);
						if (!fn) {
							break;
						}
						Folder2[fn] = 1;
					}
				} while (lib.X.ProcessFile(harc, 0) == 0);
				lib.X.CloseArchive(harc);
				for (fn in Folder2) {
					if (!Folder[fn]) {
						var strParent = fso.GetParentFolderName(fn).toLowerCase();
						if (strParent == lib.path.toLowerCase()) {
							var pidl = api.SHSimpleIDListFromPath(fso.BuildPath(root, fn), FILE_ATTRIBUTE_DIRECTORY, new Date(), 0);
							Items.AddItem(pidl);
						}
					}
				}
			}
			return Items;
		}
	},

	CreateFolder: function (path)
	{
		var s = fso.GetParentFolderName(path);
		if (s.length > 3 && !fso.FolderExists(s)) {
			this.CreateFolder(s);
		}
		if (!fso.FolderExists(path)) {
			try {
				fso.CreateFolder(path);
			} catch (e) {}
		}
	},

	ShowLine: function (s1, s2, i)
	{
		var s3 = 6466;
		if (document.documentMode > 8) {
			s3 = i > 1 ? 38192 : 38193;
			if (i > 999) {
				i = i.toLocaleString();
			}
		}
		this.Progress.SetLine(1, [api.LoadString(hShell32, s1) || api.LoadString(hShell32, s2), " ", (api.LoadString(hShell32, s3) || "%s items").replace(/%1!ls!|%s/g, i), " (", api.StrFormatByteSize(Addons.WCX.SizeTotal) ,")"].join(""), true);
		this.Progress.Timer(1);
	},

	ChangeVolProc: function (ArcName, Mode)
	{
		var r = 1;
		if (Mode) {
			MessageBox(GetText("Change Volume") + "?\n\n" + ArcName, TITLE, MB_OK);
		} else {
			r = confirmOk(GetText("Change Volume") + "\n\n" + ArcName ,TITLE) ? 1 : 0;
		}
		return r;
	},

	ProcessDataProc: function (FileName, Size)
	{
		if (Addons.WCX.Progress) {
			var points = 0;
			if (Size >= 0) {
				Addons.WCX.SizeCurrent += Size;
				points = Math.floor(Addons.WCX.SizeCurrent * 100 / Addons.WCX.SizeTotal);
				if (points > 100) {
					points = 100;
				}
			} else if (Size >= -100) {
				points = Math.abs(Size);
			}
			Addons.WCX.Progress.SetTitle(points + "%");
			Addons.WCX.Progress.SetProgress(points, 100);
			Addons.WCX.Progress.SetLine(2, String(FileName).replace(Addons.WCX.RootPath, ""), true);
			return Addons.WCX.Progress.HasUserCancelled() ? 0 : 1;
		}
		return 1;
	},

	Finalize: function ()
	{
		delete Addons.WCX.Obj;
		CollectGarbage();
		delete Addons.WCX.DLL;
	}
}
if (window.Addon == 1) {
	var twcxPath = fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), ["addons\\wcx\\twcx", api.sizeof("HANDLE") * 8, ".dll"].join(""));
	Addons.WCX.DLL = api.DllGetClassObject(twcxPath, "{56297D71-E778-4dfd-8678-6F4079A2BC50}");

	AddEvent("Finalize", Addons.WCX.Finalize);

	AddEvent("TranslatePath", function (Ctrl, Path)
	{
		if (Addons.WCX.IsHandle(Path)) {
			Ctrl.Enum = Addons.WCX.Enum;
			return ssfRESULTSFOLDER;
		}
	}, true);

	AddEvent("BeginDrag", function (Ctrl)
	{
		if (Addons.WCX.IsHandle(Ctrl)) {
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
		var hr = S_OK;
		var root = fso.BuildPath(fso.GetSpecialFolder(2).Path, "tablacus");
		var ar = [];
		for (var i = Items.Count; i-- ;) {
			var path = Items.Item(i).Path;
			if (!api.StrCmpNI(root, path, root.length) && !fso.FileExists(path)) {
				ar.unshift(fso.GetFileName(path).toLowerCase());
			}
		}
		if (!ar.length) {
			return;
		}
		var strSessionId = fso.GetParentFolderName(ar[0]).replace(root + "\\", "").replace(/\\.*/, "");
		dir = {};
		var lib = Addons.WCX.GetObject(strSessionId == Addons.WCX.ClipId ? Addons.WCX.ClipPath : Ctrl);
		if (lib) {
			Addons.WCX.SizeCurrent = 0;
			Addons.WCX.SizeTotal = 0;
			Addons.WCX.Progress = te.ProgressDialog;
			Addons.WCX.Progress.StartProgressDialog(te.hwnd, null, 2);
			try {
				Addons.WCX.Progress.SetLine(1, api.LoadString(hShell32, 33260) || api.LoadString(hShell32, 6478), true);
				var o = {};
				var root = fso.BuildPath(fso.GetSpecialFolder(2).Path, api.sprintf(99, "tablacus\\%x", Ctrl.SessionId));
				Addons.WCX.RootPath = root + "\\";
				var fh = {}, sh = {}, fl = [];
				Addons.WCX.ArcList(lib, fh, sh);
				for (var i in ar) {
					var fh1 = fh[ar[i]];
					for (var j in fh1) {
						fl.push(fh1[j]);
					}
					Addons.WCX.SizeTotal += sh[ar[i]];
				}
				for (var i = fl.length; i--;) {
					o[fl[i]] = 2;
				}
				Addons.WCX.CreateFolder(root);
				wsh.CurrentDirectory = root;
				var OpenData = {
					ArcName: lib.file,
					OpenMode: 1
				}
				Addons.WCX.ShowLine(5954, 32946, fl.length);
				var harc = lib.X.OpenArchive(OpenData);
				if (harc) {
					var op;
					do {
						var dest = null;
						var info = [];
						if (lib.X.ReadHeaderEx(harc, info)) {
							break;
						}
						var fn = info.FileName.replace(/\//g, "\\");
						if (/\.\.\\|:/.test(fn)) {
							op = 0;
							continue;
						}
						op = o[fn];
						if (op) {
							dest = fso.BuildPath(root, fn);
							if (info.FileAttr & FILE_ATTRIBUTE_DIRECTORY) {
								op = 0;
							} else {
								Addons.WCX.CreateFolder(fso.GetParentFolderName(dest));
							}
						}
					} while (lib.X.ProcessFile(harc, op, null, dest) == 0 && !Addons.WCX.Progress.HasUserCancelled());
					lib.X.CloseArchive(harc);
				}
				wsh.CurrentDirectory = fso.GetSpecialFolder(2).Path;
			} catch (e) {
				ShowError(e, "WCX");
			}
			Addons.WCX.Progress.StopProgressDialog();
			if (Addons.WCX.Progress.HasUserCancelled()) {
				hr = E_ABORT;
			}
			delete Addons.WCX.Progress;
			delete Addons.WCX.SizeCurrent;
		}
		return hr;
	});

	AddEvent("Command", function (Ctrl, hwnd, msg, wParam, lParam)
	{
		var hr = Addons.WCX.Command(Ctrl, wParam & 0xfff);
		if (isFinite(hr)) {
			return hr;
		}
	}, true);

	AddEvent("InvokeCommand", function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon)
	{
		var hr = Addons.WCX.Command(ContextMenu.FolderView, Verb);
		if (isFinite(hr)) {
			return hr;
		}
	}, true);

	AddEvent("DefaultCommand", function (Ctrl, Selected)
	{
		if (Selected.Count == 1) {
			var path = api.GetDisplayNameOf(Selected.Item(0), SHGDN_FORPARSING | SHGDN_FORADDRESSBAR | SHGDN_ORIGINAL);
			if (Addons.WCX.IsHandle(path)) {
				Ctrl.Navigate(path);
				return S_OK;
			}
			if (Selected.Item(0).IsFolder) {
				var lib = Addons.WCX.GetObject(Ctrl);
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
		if (Addons.WCX.IsHandle(path)) {
			return fso.GetParentFolderName(path);
		}
	});

	AddEvent("Context", function (Ctrl, hMenu, nPos, Selected, item, ContextMenu)
	{
		var path = api.GetDisplayNameOf(Ctrl.FolderItem, SHGDN_FORPARSING | SHGDN_FORADDRESSBAR | SHGDN_ORIGINAL);
		if (Addons.WCX.IsHandle(path)) {
			RemoveCommand(hMenu, ContextMenu, "rename");
		}
		return nPos;
	});

	AddEvent("DragEnter", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		if (Ctrl.Type <= CTRL_EB || Ctrl.Type == CTRL_DT) {
			if (Addons.WCX.IsHandle(Ctrl)) {
				return S_OK;
			}
		}
	});

	AddEvent("DragOver", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		if (Ctrl.Type <= CTRL_EB || Ctrl.Type == CTRL_DT) {
			var lib = Addons.WCX.GetObject(Ctrl);
			if (lib) {
				pdwEffect[0] = lib.X.PackFiles ? DROPEFFECT_COPY : DROPEFFECT_NONE;
				return S_OK;
			}
		}
	});

	AddEvent("Drop", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		if (Addons.WCX.IsHandle(Ctrl)) {
			Addons.WCX.Append(Ctrl, dataObj);
			return S_OK;
		}
	});

	AddEvent("DragLeave", function (Ctrl)
	{
		return S_OK;
	});

	AddEvent("AddonDisabled", function (Id)
	{
		if (Id.toLowerCase() == "wcx") {
			Addons.WCX.Finalize();
		}
	});

	AddEvent("BeforeNavigate", function (Ctrl, fs, wFlags, Prev)
	{
		if (Ctrl.Type <= CTRL_EB && Addons.WCX.IsHandle(Prev)) {
			var root = fso.BuildPath(fso.GetSpecialFolder(2).Path, api.sprintf(99,"tablacus\\%x", Ctrl.SessionId));
			DeleteItem(root);
		}
	});

	AddEvent("BeginLabelEdit", function (Ctrl, Name)
	{
		if (Ctrl.Type <= CTRL_EB) {
			if (Addons.WCX.IsHandle(Ctrl)) {
				return 1;
			}
		}
	});

	AddEvent("ToolTip", function (Ctrl, Index)
	{
		if (Ctrl.Type <= CTRL_EB) {
			if (Addons.WCX.IsHandle(Ctrl)) {
				var Item = Ctrl.Items.Item(Index);
				if (Item.IsFolder) {
					var s = FormatDateTime(Item.ModifyDate);
					return s ? api.PSGetDisplayName("Write") + " : " + s : "";
				}
			}
		}
	});

}
