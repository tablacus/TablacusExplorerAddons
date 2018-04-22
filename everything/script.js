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
		fncb: {},
		nDog: 0,

		IsHandle: function (Ctrl)
		{
			return api.PathMatchSpec(typeof(Ctrl) == "string" ? Ctrl : api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL), Addons.Everything.PATH + "*");
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
				if (!/path:.+/.test(s) && ((api.GetAsyncKeyState(VK_SHIFT) < 0 ? 1: 0) ^ Addons.Everything.Subfolders)) {
					var path = FV.FolderItem.Path;
					if (/^[A-Z]:\\|^\\\\/i.test(path)) {
						s += " path:" + api.PathQuoteSpaces((path + "\\").replace(/\\\\$/, "\\"));
					}
				}
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
			var Path = typeof(Ctrl) == "string" ? Ctrl : api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL);
			if (Addons.Everything.IsHandle(Path)) {
				return Path.replace(new RegExp("^" + Addons.Everything.PATH, "i"), "").replace(/^\s+|\s+$/g, "");
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
							FV.AddItem(api.GetDisplayNameOf(pidl2, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL));
						}
					}
				}
			}
		},

		Enum: function (pid, Ctrl, fncb, SessionId)
		{
			if (fncb) {
				var Path = Addons.Everything.GetSearchString(pid);
				if (Addons.Everything.RE && !/^regex:/i.test(Path)) {
					Path = 'regex:' + ((window.migemo && (migemo.query(Path) + '|' + Path)) || Path);
				}
				if (Path) {
					var hwndView = Ctrl.hwndView;
					Addons.Everything.fncb[Ctrl.Id] = fncb;
					if (!Addons.Everything.Open(Path, hwndView) && Addons.Everything.ExePath) {
						if (Addons.Everything.nDog++ < 9) {
							try {
								wsh.Run(ExtractMacro(te, Addons.Everything.ExePath), SW_SHOWNORMAL);
								setTimeout(function()
								{
									Addons.Everything.Enum(pid, Ctrl, fncb, SessionId);
								}, Addons.Everything.nDog * 99);
							} catch (e) {}
						} else {
							Addons.Everything.nDog = 0;
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
			Ctrl.Enum = Addons.Everything.Enum;
			return ssfRESULTSFOLDER;
		}
	}, true);

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
			Addons.Everything.fncb[Ctrl.Id](Ctrl, arItems);
			delete Addons.Everything.fncb[Ctrl.Id];
			Addons.Everything.nDog = 0;
			return S_OK;
		}
	});

	AddEvent("GetFolderItemName", function (pid)
	{
		if (Addons.Everything.IsHandle(pid)) {
			var res = /(.*?) *path:"?.+?"?/.exec(pid.Path);
			return res ? res[1] : pid.Path;
		}
	}, true);

	AddEvent("GetIconImage", function (Ctrl, BGColor)
	{
		if (Addons.Everything.IsHandle(Ctrl)) {
			return MakeImgSrc(Addons.Everything.Icon, 0, false, 16);
		}
	});

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
				var path = api.GetDisplayNameOf(ContextMenu.Items.Item(0), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL);
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

	AddEvent("ILGetParent", function (FolderItem)
	{
		if (Addons.Everything.IsHandle(FolderItem)) {
			var res = /path:"?(.+?)"?/.exec(Addons.Everything.GetSearchString(FolderItem));
			return res ? res[1] : ssfDESKTOP;
		}
	});

	var width = "176px";

	var s = item.getAttribute("Folders");
	if (s) {
		Addons.Everything.Max = api.QuadPart(s);
	}
	var s = item.getAttribute("Width");
	if (s) {
		width = (api.QuadPart(s) == s) ? (s + "px") : s;
	}
	Addons.Everything.ExePath = ExtractMacro(te, item.getAttribute("Exec"));
	if (!Addons.Everything.ExePath) {
		var path = fso.BuildPath(api.GetDisplayNameOf(ssfPROGRAMFILES, SHGDN_FORPARSING), "Everything\\Everything.exe");
		if (!fso.FileExists(path)) {
			path = path.replace(/ \(x86\)\\/, "\\");
		}
		if (fso.FileExists(path)) {
			Addons.Everything.ExePath = api.PathQuoteSpaces(path) + " -startup";
		}
	}
	var icon = ExtractMacro(te, api.PathUnquoteSpaces(item.getAttribute("Icon")));
	if (!icon) {
		if (Addons.Everything.ExePath) {
			var path = ExtractMacro(te, api.PathUnquoteSpaces(Addons.Everything.ExePath.replace(/\s*\-startup$/, "")));
			if (fso.FileExists(path)) {
				icon = 'icon:' + path + ',0';
			}
		}
		if (!icon) {
			icon = "bitmap:ieframe.dll,216,16,17";
		}
	}
	Addons.Everything.Icon = icon;
	Addons.Everything.RE = api.LowPart(item.getAttribute("RE"));
	Addons.Everything.Subfolders = api.LowPart(item.getAttribute("Subfolders")) ? 1 : 0;
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

	SetAddon(Addon_Id, Default, ['<input type="text" name="everythingsearch" placeholder="Everything" onkeydown="return Addons.Everything.KeyDown(this)" onmouseup="Addons.Everything.Change(this)" onfocus="Addons.Everything.Focus(this)" onblur="Addons.Everything.ShowButton()" style="width:', EncodeSC(width), '; padding-right:', WINVER < 0x602 ? "32" : "16", 'px; vertical-align: middle"><span class="button" style="position: relative"><input type="image" id="ButtonEverythingClear" src="bitmap:ieframe.dll,545,13,1" onclick="Addons.Everything.Clear()" style="display: none; position: absolute; left: -33px; top: -5px" hidefocus="true"><input type="image" src="', EncodeSC(icon), '" onclick="Addons.Everything.Search()" hidefocus="true" style="position: absolute; left: -18px; top: -7px; width 16px; height: 16px"></span>'], "middle");
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
