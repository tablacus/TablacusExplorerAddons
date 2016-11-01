var Addon_Id = "everything";
var Default = "ToolBar2Right";

var item = GetAddonElement(Addon_Id);

if (window.Addon == 1) {
	Addons.Everything =
	{
		PATH: "es:",
		iCaret: -1,
		strName: "Everything",
		Max: 1000,
		RE: false,
		tid: [],

		IsHandle: function (Ctrl)
		{
			return api.PathMatchSpec(typeof(Ctrl) == "string" ? Ctrl : api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING), Addons.Everything.PATH + "*");
		},

		Change: function (o)
		{
		},

		KeyDown: function (o)
		{
			setTimeout(Addons.Everything.ShowButton, 99);
			if (event.keyCode == VK_RETURN) {
				Addons.Everything.Search();
				return false;
			}
		},

		Search: function (s)
		{
			var FV = te.Ctrl(CTRL_FV);
			var s = s || document.F.everythingsearch.value;
			if (s.length) {
				FV.Navigate(Addons.Everything.PATH + s, Addons.Everything.NewTab ? SBSP_NEWBROWSER : SBSP_SAMEBROWSER);
			}
		},

		Focus: function (o)
		{
			o.select();
			if (this.iCaret >= 0) {
				var range = o.createTextRange();
				range.move("character", this.iCaret);
				range.select();
				this.iCaret = -1;
			}
			Addons.Everything.ShowButton();
		},

		Clear: function ()
		{
			document.F.everythingsearch.value = "";
			Addons.Everything.ShowButton();
		},

		ShowButton: function ()
		{
			if (WINVER < 0x602) {
				document.getElementById("ButtonEverythingClear").style.display = document.F.everythingsearch.value.length ? "inline" : "none";
			}
		},

		GetSearchString: function(Ctrl)
		{
			if (Ctrl.FolderItem) {
				var Path = Ctrl.FolderItem.Path;
				if (Addons.Everything.IsHandle(Path)) {
					return Path.replace(new RegExp("^" + Addons.Everything.PATH, "i"), "").replace(/^\s+|\s+$/g, "");
				}
			}
			return "";
		},

		Exec: function ()
		{
			document.F.everythingsearch.focus();
			return S_OK;
		},

		Delete: function (pidl)
		{
			var cFV = te.Ctrls(CTRL_FV);
			for (var i in cFV) {
				var FV = cFV[i];
				if (FV.hwnd && this.IsHandle(FV)) {
					FV.RemoveItem(pidl);
				}
			}
		},

		Rename: function (pidl, pidl2)
		{
			var fn = api.GetDisplayNameOf(pidl2, SHGDN_INFOLDER);
			var cFV = te.Ctrls(CTRL_FV);
			for (var i in cFV) {
				var FV = cFV[i];
				if (FV.hwnd && this.IsHandle(FV)) {
					var Path = Addons.Everything.GetSearchString(FV);
					if (Path) {
						if (FV.RemoveItem(pidl) == S_OK) {
							if (Addons.Everything.RE && !/^regex:/i.test(Path)) {
								Path = ((window.migemo && (migemo.query(Path) + '|' + Path)) || Path);
								if (new RegExp(Path, "i").test(fn)) {
									FV.AddItem(api.GetDisplayNameOf(pidl2, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING));
								}
							} else {
								if (!/[\*\?]/.test(Path)) {
									Path = "*" + Path + "*";
								}
								if (api.PathMatchSpec(fn, Path)) {
									FV.AddItem(api.GetDisplayNameOf(pidl2, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING));
								}
							}
						}
					}
				}
			}
		},

		Open: function (Path, hwndView)
		{
			var hwnd = api.FindWindow("EVERYTHING_TASKBAR_NOTIFICATION", null);
			if (hwnd) {
				var query = new ApiStruct({
					reply_hwnd: [VT_I4, 4],
					reply_copydata_message: [VT_I4, 4],
					search_flags: [VT_I4, api.sizeof("DWORD")],
					offset: [VT_I4, api.sizeof("DWORD")],
					max_results: [VT_I4, api.sizeof("DWORD")],
					search_string: [VT_LPWSTR, api.sizeof("WCHAR"), Path.length + 1]
				}, 4);
				query.Write("reply_hwnd", hwndView);
				query.Write("reply_copydata_message", 2);
				query.Write("max_results", Addons.Everything.Max);
				query.Write("search_string", Path);

				var cds = api.Memory("COPYDATASTRUCT");
				cds.cbData = query.Size;
				cds.dwData = 2;//EVERYTHING_IPC_COPYDATAQUERY;
				cds.lpData = query.Memory;
				api.SendMessage(hwnd, WM_COPYDATA, hwndView, cds);
			}
			return hwnd;
		}

	};

	AddEvent("TranslatePath", function (Ctrl, Path)
	{
		if (Addons.Everything.IsHandle(Path)) {
			return ssfRESULTSFOLDER;
		}
	}, true);

	AddEvent("NavigateComplete", function (Ctrl)
	{
		if (!Addons.Everything.IsHandle(Ctrl) || Addons.Everything.tid[Ctrl.Id]) {
			return;
		}
		Ctrl.SortColumn = "";
		Addons.Everything.tid[Ctrl.Id] = setTimeout(function () {
			delete Addons.Everything.tid[Ctrl.Id];
			var Path = Addons.Everything.GetSearchString(Ctrl);
			if (Addons.Everything.RE && !/^regex:/i.test(Path)) {
				Path = 'regex:' + ((window.migemo && (migemo.query(Path) + '|' + Path)) || Path);
			}
			if (Path) {
				var hwndView = Ctrl.hwndView;
				if (!Addons.Everything.Open(Path, hwndView) && Addons.Everything.ExePath) {
					wsh.Run(ExtractMacro(te, Addons.Everything.ExePath));
					setTimeout(function ()
					{
						Addons.Everything.Open(Path , hwndView);
					}, 500);
				}
			}
		}, 99);
	});

	AddEvent("CopyData", function (Ctrl, cd, wParam)
	{
		if (cd.dwData == 2 && cd.cbData) {
			var data = api.Memory("BYTE", cd.cbData, cd.lpData);
			var EVERYTHING_IPC_LIST =
			{
				totfolders: [VT_I4, api.sizeof("DWORD")],
				totfiles: [VT_I4, api.sizeof("DWORD")],
				totitems: [VT_I4, api.sizeof("DWORD")],
				numfolders: [VT_I4, api.sizeof("DWORD")],
				numfiles: [VT_I4, api.sizeof("DWORD")],
				numitems: [VT_I4, api.sizeof("DWORD")],
				offset: [VT_I4, api.sizeof("DWORD")]
			};
			var list = new ApiStruct(EVERYTHING_IPC_LIST, 4, data);
			var nItems = list.Read("totitems");
			if (Addons.Everything.Max && nItems > Addons.Everything.Max) {
				nItems = Addons.Everything.Max;
			}
			var EVERYTHING_IPC_ITEM =
			{
				flags: [VT_I4, api.sizeof("DWORD")],
				filename_offset: [VT_I4, api.sizeof("DWORD")],
				path_offset: [VT_I4, api.sizeof("DWORD")]
			};
			var arItems = [];
			var item = new ApiStruct(EVERYTHING_IPC_ITEM, 4);
			var itemSize = item.Size;
			for (var i = 0; i < nItems && api.GetAsyncKeyState(VK_ESCAPE) >= 0; i++) {
				var item = new ApiStruct(EVERYTHING_IPC_ITEM, 4, api.Memory("BYTE", itemSize, cd.lpData + list.Size + list.Read("offset") + itemSize * i));
				arItems.push(data.Read(item.Read("path_offset"), VT_LPWSTR) + "\\" + data.Read(item.Read("filename_offset"), VT_LPWSTR));
			}
			Ctrl.RemoveAll();
			Ctrl.AddItems(arItems);
			return S_OK;
		}
	});
	
	AddEvent("GetTabName", function (Ctrl)
	{
		var Path = Ctrl.FolderItem.Path;
		if (Addons.Everything.IsHandle(Path)) {
			return Path.replace(Addons.Everything.PATH, "");
		}
	}, true);

	AddEvent("ChangeView", function (Ctrl)
	{
		document.F.everythingsearch.value = Addons.Everything.GetSearchString(Ctrl);
		Addons.Everything.ShowButton();
	});

	AddEvent("Context", function (Ctrl, hMenu, nPos, Selected, item, ContextMenu)
	{
		if (Addons.Everything.IsHandle(Ctrl)) {
			api.InsertMenu(hMenu, -1, MF_BYPOSITION | MF_STRING, ++nPos, api.LoadString(hShell32, 31368));
			ExtraMenuCommand[nPos] = OpenContains;
		}
		return nPos;
	});

	AddEvent("InvokeCommand", function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon)
	{
		if (!Verb || Verb == CommandID_STORE - 1) {
			if (ContextMenu.Items.Count >= 1) {
				var path = api.GetDisplayNameOf(ContextMenu.Items.Item(0), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
				if (Addons.Everything.IsHandle(path)) {
					var FV = te.Ctrl(CTRL_FV);
					FV.Navigate(path, SBSP_SAMEBROWSER);
					return S_OK;
				}
			}
		}
	});

	AddEvent("ChangeNotify", function (Ctrl, pidls)
	{
		if (pidls.lEvent & (SHCNE_DELETE | SHCNE_RMDIR)) {
			Addons.Everything.Delete(pidls[0]);
		}
		if (pidls.lEvent & (SHCNE_RENAMEFOLDER | SHCNE_RENAMEITEM)) {
			Addons.Everything.Rename(pidls[0], pidls[1]);
		}
	});

	var width = "176px";
	var icon = "bitmap:ieframe.dll,216,16,17";

	var s = item.getAttribute("Folders");
	if (s) {
		Addons.Everything.Max = api.QuadPart(s);
	}
	var s = item.getAttribute("Width");
	if (s) {
		width = (api.QuadPart(s) == s) ? (s + "px") : s;
	}
	var s = item.getAttribute("Icon");
	if (s) {
		icon = s;
	}
	Addons.Everything.RE = api.LowPart(item.getAttribute("RE"));
	Addons.Everything.ExePath = ExtractMacro(te, item.getAttribute("Exec"));
	//Menu
	if (item.getAttribute("MenuExec")) {
		Addons.Everything.nPos = api.LowPart(item.getAttribute("MenuPos"));
		var s = item.getAttribute("MenuName");
		if (s && s != "") {
			Addons.Everything.strName = s;
		}
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
		{
			api.InsertMenu(hMenu, Addons.Everything.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Addons.Everything.strName));
			ExtraMenuCommand[nPos] = Addons.Everything.Exec;
			return nPos;
		});
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.Everything.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.Everything.Exec, "Func");
	}
	Addons.Everything.NewTab = api.QuadPart(item.getAttribute("NewTab"));
	AddTypeEx("Add-ons", "Everything", Addons.Everything.Exec);

	var s = ['<input type="text" name="everythingsearch" placeholder="Everything" onkeydown="return Addons.Everything.KeyDown(this)" onmouseup="Addons.Everything.Change(this)" onfocus="Addons.Everything.Focus(this)" onblur="Addons.Everything.ShowButton()" style="width:', width, '; padding-right:', WINVER < 0x602 ? "32" : "16", 'px; vertical-align: middle"><span class="button" style="position: relative"><input type="image" id="ButtonEverythingClear" src="bitmap:ieframe.dll,545,13,1" onclick="Addons.Everything.Clear()" style="display: none; position: absolute; left: -33px; top: -5px" hidefocus="true"><input type="image" src="', icon, '" onclick="Addons.Everything.Search()" hidefocus="true" style="position: absolute; left: -18px; top: -7px; width 16px; height: 16px"></span>'];
	SetAddon(Addon_Id, Default, s, "middle");
} else {
	var s = ['<table style="width: 100%"><tr><td><label>Width</label></td></tr><tr><td><input type="text" name="Width" size="10" /></td><td><input type="button" value="Default" onclick="document.F.Width.value=\'\'" /></td></tr>'];
	s.push('<tr><td><label>Action</label></td></tr>');
	s.push('<tr><td><input type="checkbox" name="NewTab" id="NewTab"><label for="NewTab">Open in New Tab</label>&emsp;<input type="checkbox" id="RE" name="RE" /><label for="RE">Regular Expression</label>/<label for="RE">Migemo</label></td></tr>');
	s.push('<tr><td style="width: 100%"><label>Folders</label></td></tr><tr><td><input type="text" name="Folders" size="10" /></td><td><input type="button" value="Default" onclick="document.F.Folders.value=1000" /></td></tr>');
	s.push('<tr><td style="width: 100%"><label>Exec</label></td></tr><tr><td><input type="text" name="Exec" style="width: 100%" /></td><td><input type="button" value="Default" onclick="SetExe()" /></td></tr></table>');
	s.push('<br /><br /><input type="button" value="', api.sprintf(999, GetText("Get %s..."), "Everything"), '" title="http://www.voidtools.com/" onclick="wsh.Run(this.title)">');
	SetTabContents(0, "General", s.join(""));

	SetExe = function ()
	{
		var path =fso.BuildPath(api.GetDisplayNameOf(ssfPROGRAMFILES, SHGDN_FORPARSING), "Everything\\Everything.exe");
		if (!fso.FileExists(path)) {
			path = path.replace(/ \(x86\)\\/, "\\");
		}
		if (fso.FileExists(path) && confirmOk("Are you sure?")) {
			document.F.Exec.value = api.PathQuoteSpaces(path) + " -startup";
		}
	}
}
