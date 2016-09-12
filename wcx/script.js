var Addon_Id = "wcx";
var item = GetAddonElement(Addon_Id);

Addons.WCX =
{
	tid: [],
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
			file: typeof(Ctrl) == "string" ? Ctrl : api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING),
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
						lib.X.SetChangeVolProc(-1, Addons.WCX.ChangeVolProc);
						lib.X.SetProcessDataProc(-1, Addons.WCX.ProcessDataProc);
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
			var dllPath = (ExtractMacro(te, item.getAttribute("Path")) + (api.sizeof("HANDLE") > 4 ? "64" : "")).replace(/\.u(wcx64)$/, ".$1");
			var WCX = Addons.WCX.DLL.open(dllPath);
			if (WCX && WCX.OpenArchive) {
				Addons.WCX.Obj.push({ X: WCX, filter: filter});
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

	Append: function (Ctrl, Items)
	{
		if (!Items.Count) {
			return;
		}
		var lib = Addons.WCX.GetObject(Ctrl);
		if (lib && lib.X.PackFiles) {
			var ar = [], root;
			root = Items.Item(-1).Path;
			for (var i = Items.Count; i-- > 0;) {
				var Item = Items.Item(i);
				ar.unshift(api.PathQuoteSpaces(Item.Path.replace(root, "").replace(/^\\/, "")));
			}
			ar.push("");
			if (lib.X.PackFiles(lib.file, lib.path, root + "\\", ar.join("\0"), 0) == 0) {
				Addons.WCX.Refresh(Ctrl);
			}
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
			var ar = [];
			for (var i = Items.Count; i-- > 0;) {
				ar.unshift(api.PathQuoteSpaces(Items.Item(i).Path.replace(root, "").replace(/^\\/, "")));
			}
			ar.push("");
			if (lib.X.DeleteFiles(lib.file, ar.join("\0")) == 0) {
				Addons.WCX.Refresh(Ctrl);
			}
		}
	},

	Navigate: function (Ctrl)
	{
		var path = Ctrl.FolderItem.Path;
		var lib = Addons.WCX.GetObject(path);
		if (lib) {
			Ctrl.SortColumn = "";
			clearTimeout(Addons.WCX.tid[Ctrl.Id]); 
			Addons.WCX.tid[Ctrl.Id] = setTimeout(function ()
			{
				delete Addons.WCX.tid[Ctrl.Id];
				Ctrl.RemoveAll();
				var root = fso.BuildPath(fso.GetSpecialFolder(2).Path, api.sprintf(99,"tablacus\\%x", Ctrl.SessionId));
				var OpenData = {
					ArcName: lib.file,
					OpenMode: 0
				}
				var harc = lib.X.OpenArchive(OpenData);
				if (harc) {
					var Folder = {}, Folder2 = {};
					do {
						var info = [];
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
							Ctrl.AddItem(api.SHSimpleIDListFromPath(fso.BuildPath(root, fn), info.FileAttr, info.FileTime, info.UnpSize));
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
								Ctrl.AddItem(pidl);
							}
						}
					}
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
		if (Size > 999 && document.documentMode > 8) {
			Size = Size.toLocaleString();
		}
		ShowStatusText(te, FileName + " : " + Size);
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
			return ssfRESULTSFOLDER;
		}
	}, true);

	AddEvent("NavigateComplete", Addons.WCX.Navigate);
	
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
		var lib = Addons.WCX.GetObject(strSessionId == Addons.WCX.ClipId ? Addons.WCX.ClipPath : Ctrl);
		if (lib) {
			var o = {}, dest;
			var root = fso.BuildPath(fso.GetSpecialFolder(2).Path, "tablacus\\" + strSessionId);
			for (var i = ar.length; i--;) {
				ar[i] = api.PathQuoteSpaces(ar[i].replace(root, "").replace(/^\\/, ""));
				o[ar[i]] = 2;
			}
			Addons.WCX.CreateFolder(root);
			wsh.CurrentDirectory = root;
			var OpenData = {
				ArcName: lib.file,
				OpenMode: 1
			}
			var harc = lib.X.OpenArchive(OpenData);
			if (harc) {
				do {
					var info = [];
					if (lib.X.ReadHeaderEx(harc, info)) {
						break;
					}
					var fn = info.FileName.replace(/\//g, "\\");
					if (/\.\.\\|:/.test(fn)) {
						continue;
					}
					var op = o[fn];
					if (op) {
						dest = fso.BuildPath(root, fn);
						if (/\\/.test(fn)) {
							Addons.WCX.CreateFolder(fso.GetParentFolderName(dest));
						}
					}
				} while (lib.X.ProcessFile(harc, op, null, dest) == 0);
				lib.X.CloseArchive(harc);
			}
			wsh.CurrentDirectory = fso.GetSpecialFolder(2).Path;
		}
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
			var path = api.GetDisplayNameOf(Selected.Item(0), SHGDN_FORPARSING | SHGDN_FORADDRESSBAR);
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
		var path = api.GetDisplayNameOf(Ctrl.FolderItem, SHGDN_FORPARSING | SHGDN_FORADDRESSBAR);
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
