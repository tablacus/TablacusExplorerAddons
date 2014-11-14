if (window.Addon == 1) {
	Addons.XFinder =
	{
		SW: SW_SHOWNORMAL,
	
		Command:
		{
			newtab: function (Ctrl, hwnd, pt, line)
			{
				return Exec(Ctrl, "New Tab", "Tabs", hwnd, pt);
			},
			
			close: function (Ctrl, hwnd, pt, line)
			{
				var p = ExtractMacro(Ctrl, line);
				if (api.strcmpi(p, "Window") == 0) {
					return Exec(Ctrl, "Close Application", "Tools", hwnd, pt);
				}
				if (api.strcmpi(p, "Minimize") == 0) {
					api.ShowWindow(te.hwnd, SW_SHOWMINIMIZED);
					return S_OK;
				}
				if (api.strcmpi(p, "ToTray") == 0) {
					if (Addons.TaskTray) {
						Addons.TaskTray.CreateIcon(true);
					}
					return S_OK;
				}
				if (p.match(/[\\\/\\*\\?]/)) {
					var FV = GetFolderView(Ctrl, pt);
					if (FV) {
						var TC = FV.Parent;
						for (var i = TC.Count; i--;) {
							if (PathMatchEx(api.GetDisplayNameOf(TC[i], SHGDN_FORPARSINGEX | SHGDN_FORPARSING) + "", p)) {
								TC[i].Close();
							}
						}
					}
					return S_OK;
				}
				switch (api.LowPart(p) % 10) {
					case 0:
						return Exec(Ctrl, "Close Tab", "Tabs", hwnd, pt);
					case 1:
						return Exec(Ctrl, "Close Other Tabs", "Tabs", hwnd, pt);
					case 2:
						var FV = GetFolderView(Ctrl, pt);
						if (FV) {
							var TC = FV.Parent;
							for (var i = TC.Count; i--;) {
								FV = TC[i];
								for (var j = TC.Count; j--;) {
									if (i != j && api.ILIsEqual(FV, TC[j])) {
										TC[i].Close();
										break;
									}
								}
							}
						}
						return S_OK;
					case 4:
						var FV = GetFolderView(Ctrl, pt);
						if (FV) {
							var TC = FV.Parent;
							for (var i = TC.Count; i--;) {
								TC[i].Close();
							}
						}
						return S_OK;
					case 7:
						return Exec(Ctrl, "Close Tabs on Left", "Tabs", hwnd, pt);
					case 9:
						return Exec(Ctrl, "Close Tabs on Right", "Tabs", hwnd, pt);
				}
			},
			
			refresh: function (Ctrl, hwnd, pt, line)
			{
				return Exec(Ctrl, "Refresh", "Tabs", hwnd, pt);
			},
			
			rename: function (Ctrl, hwnd, pt, line)
			{
				var FV = GetFolderView(Ctrl, pt);
				setTimeout(function () {
					if (FV) {
						FV.SelectItem(FV.FocusedItem, SVSI_FOCUSED | SVSI_ENSUREVISIBLE | SVSI_EDIT);
					}
					else {
						wsh.SendKeys("{F2}");
					}
				}, 100);
				return S_OK;
			},
			
			go: function (Ctrl, hwnd, pt, line)
			{
				var p = api.QuadPart(ExtractMacro(Ctrl, line));
				if (p == -1) {
					return Exec(Ctrl, "Back", "Tabs", hwnd, pt);
				}
				if (p == 1) {
					return Exec(Ctrl, "Forward", "Tabs", hwnd, pt);
				}
				return S_OK;
			},
			
			newfolder: function (Ctrl, hwnd, pt, line)
			{
				var p = ExtractMacro(Ctrl, line);
				p = p.match("/") ? p.replace(/\\\//g, "") : InputDialog(GetText("New Folder"), p);
				if (p) {
					if (!p.match(/^[A-Z]:\\|^\\/i)) {
						var FV = GetFolderView(Ctrl, pt);
						p = fso.BuildPath(FV.FolderItem.Path, p);
					}
					CreateFolder(p);
				}
				return S_OK;
			},
			
			folder: function (Ctrl, hwnd, pt, line)
			{
				var p = ExtractMacro(Ctrl, line);
				if (p.length) {
					if (api.strcmpi(p, "Find") == 0) {
						sha.FindFiles()
						return S_OK;
					}
					var FV = GetFolderView(Ctrl, pt);
					if (FV) {
						Addons.XFinder.Run(FV, FV, p);
					}
					return S_OK;
				}
				var TV = te.Ctrl(CTRL_TV);
				if (TV) {
					TV.Align = TV.Align ^ 2;
					if (TV.Width == 0 && TV.Align & 2) {
						TV.Width = 200;
					}
				}
				return S_OK;
			},

			newfile: function (Ctrl, hwnd, pt, line)
			{
				var p = ExtractMacro(Ctrl, line);
				p = p.match("/") ? p.replace(/\\\//g, "") : InputDialog(GetText("New File"), p);
				if (p) {
					if (!p.match(/^[A-Z]:\\|^\\/i)) {
						var FV = GetFolderView(Ctrl, pt);
						p = fso.BuildPath(FV.FolderItem.Path, p);
					}
					CreateFile(p);
				}
				return S_OK;
			},

			exec: function (Ctrl, hwnd, pt, line)
			{
				if (line.length) {
					var FV = GetFolderView(Ctrl, pt);
					if (FV) {
						if (api.strcmpi(line, "Undo") == 0) {
							api.SendMessage(FV.hwndView, WM_COMMAND, 28700 - 1, 0);
							return S_OK;
						}
						var Selected = FV.SelectedItems();
						Addons.XFinder.Run(Selected ? Selected : FV, FV, line);
					}
				}
				return S_OK;
			},
			
			command: function (Ctrl, hwnd, pt, line)
			{
				return Exec(Ctrl, "Run Dialog", "Tools", hwnd, pt);
			},
			
			clippath: function (Ctrl, hwnd, pt, line)
			{
				var FV = GetFolderView(Ctrl, pt);
				if (FV) {
					var p = api.sscanf(line, "%x");
					var Items;
					if (p >= 0x10) {
						Items = FV.SelectedItems();
					}
					else {
						Items = te.FolderItems();
						Items.AddItem(FV.FocusedItem);
					}
				}
				var a = [];
				for (var i = 0; i < Items.Count; i++) {
					var s = Items[i].Path;
					if (p & 1) {
						s = s.replace(/\..+$/, "");
					}
					if (p & 2) {
						s = fso.GetFileName(s);
					}
					if (!(p & 8)) {
						s = api.PathQuoteSpaces(s);
					}
					a.push(s);
				}
				clipboardData.setData("text", a.join("\n"));
				return S_OK;
			},
			
			preview: function (Ctrl, hwnd, pt, line)
			{
				return S_OK;
			},
			
			viewstyle: function (Ctrl, hwnd, pt, line)
			{
				var FV = GetFolderView(Ctrl, pt);
				if (FV) {
					if (api.strcmpi(line, "Menu") == 0) {
						Addons.XFinder.Popup(FV, /&V/);
						return S_OK;
					}
					var p = api.sscanf(line, "%d");
					if (p < FVM_ICON || p > FVM_THUMBNAIL) {
						p = FV.CurrentViewMode;
						if (p == FVM_ICON && FV.IconSize >= 96) {
							p = FVM_THUMBNAIL;
						}
						if (++p > FVM_THUMBNAIL) {
							p = FVM_ICON;
						}
						if (p == FVM_SMALLICON) {
							p++;
						}
					}
					FV.CurrentViewMode = p;
					if (p == FVM_ICON) {
						FV.IconSize = 48;
					}
					if (p == FVM_THUMBNAIL) {
						FV.IconSize = 96;
					}
				}
				return S_OK;
			},

			sort: function (Ctrl, hwnd, pt, line)
			{
				var FV = GetFolderView(Ctrl, pt);
				if (FV) {
					var s = ExtractMacro(Ctrl, line);
					if (s) {
						FV.SortColumn = s;
						return S_OK;
					}
					Addons.XFinder.Popup(FV, /&[O|I]/);
				}
				return S_OK;
			},

			confirm: function (Ctrl, hwnd, pt, line)
			{
				var ar = Addons.XFinder.SetCommaText(ExtractMacro(Ctrl, line));
				return wsh.Popup(ar[1], 0, ar[0], MB_YESNO | MB_ICONQUESTION | MB_SYSTEMMODAL) != IDNO ? S_OK : E_ABORT;
			},

			columns: function (Ctrl, hwnd, pt, line)
			{
				var FV = GetFolderView(Ctrl, pt);
				if (FV) {
					FV.Columns = ExtractMacro(FV, line.substr(x)).replace(/,/g, " ");
				}
			 	return S_OK;
			},

			sendkeys: function (Ctrl, hwnd, pt, line)
			{
				wsh.SendKeys(ExtractMacro(Ctrl, line.substr(x).trim()));
			 	return S_OK;
			},

			set: function (Ctrl, hwnd, pt, line)
			{
				var ar = line.split("=");
				var a = ar.shift().toLowerCase();
				var d = ExtractMacro(Ctrl, ar.join("="));
				var fn = Addons.XFinder.Env[a];
				if (fn) {
					return fn(Ctrl, hwnd, pt, d)
				}
				te.Data.XFEnv[a] = d;
			 	return S_OK;
			},
			
			swap: function (Ctrl, hwnd, pt, line)
			{
				var ar = line.toLowerCase().split(",");
				var a = ExtractMacro(Ctrl, "%" + ar[0] + "%");
				Addons.XFinder.Command.set(Ctrl, hwnd, pt, ar[0] + "=%" + ar[1] + "%");
				Addons.XFinder.Command.set(Ctrl, hwnd, pt, ar[1] + "=" + a);
			 	return S_OK;
			},

			input: function (Ctrl, hwnd, pt, line)
			{
				var ar = Addons.XFinder.SetCommaText(ExtractMacro(Ctrl, line));
				te.Data.XFEnv.inputdata = InputDialog([ar[1], ar[2]].join("\n"), ar[3], ar[0]);
				if (api.strcmpi(typeof(te.Data.XFEnv.inputdata), "string")) {
					te.Data.XFEnv.inputdata = "";
					return E_ABORT;
				}
			 	return S_OK;
			},

			choosefolder: function (Ctrl, hwnd, pt, line)
			{
				var pt = api.Memory("POINT");
				api.GetCursorPos(pt);
				var FolderItem = FolderMenu.Open(ExtractMacro(Ctrl, line), pt.x, pt.y);
				if (FolderItem) {
					te.Data.XFEnv.inputdata = api.GetDisplayNameOf(FolderItem, SHGDN_FORPARSING | SHGDN_FORPARSINGEX);
				 	return S_OK;
				}
				return S_FALSE;
			},
			
			lock: function (Ctrl, hwnd, pt, line)
			{
				var p = ExtractMacro(Ctrl, line);
				var TC = te.Ctrl(CTRL_TC);
				if (TC) {
					if (p.length) {
						var FV = TC[TC.SelectedIndex];
						if (FV) {
							FV.Data.Lock = !api.QuadPart(p);
						}
					}
					Lock(TC, TC.SelectedIndex, true);
				}
			 	return S_OK;
			},
			
			foreach: function (Ctrl, hwnd, pt, line)
			{
				var FV = GetFolderView(Ctrl, pt);
				if (FV) {
					var Selected = FV.SelectedItems();
					if (Selected) {
						for (var i = 0; i < Selected.Count; i++) {
							if (Addons.XFinder.Exec(Ctrl, hwnd, pt, line.replace(/%Variable%/ig, api.GetDisplayNameOf(Selected.Item(i), SHGDN_FORPARSING))) != S_OK) {
								break;
							}
						}
					}
				}
			},

			numbering: function (Ctrl, hwnd, pt, line)
			{
				var FileList, FileIndex, i, strPath, nMode;
				var nStart, nInc, wsSrc, wsDist;
				var DoRename = function(n)
				{
					try {
						var wsPath, nSame;
						var strPath = FileList[n];
						var wsFile = fso.GetBaseName(strPath);
						var wsExt = fso.GetExtensionName(strPath);
						wsExt = wsExt ? "." + wsExt : wsExt;
						var wsParam = ar[0];
						var nD = nStart + FileIndex[n] * nInc;
						var z = wsParam.length + MAX_PATH;
						switch (nMode) {
							case 1:
								wsPath = api.sprintf(z, wsParam, wsFile, wsExt);		// %s%s
								break;
							case 2:
								wsPath = api.sprintf(z, wsParam, wsFile, nD, wsExt); 	// %s%d%s
								break;
							case 3:
								wsPath = api.sprintf(z, wsParam, nD, wsFile, wsExt);	// %d%s%s
								break;
							default:
								wsPath = api.sprintf(z, wsParam, nD) + wsExt; 			// %d
								break;
						}
						wsPath = fso.BuildPath(fso.GetParentFolderName(strPath), wsPath.replace(wsSrc, wsDist));
						if (api.strcmpi(wsPath, FileList[n])) {
							nSame = FileList.indexOf(wsPath);
							if (nSame >= 0) {
								DoRename(nSame);
								if (nSame < n) {
									n--;
								}
							}
							arFrom.push(FileList[n]);
							arTo.push(wsPath);
						}
					} catch (e) {
					}
					FileList.splice(n, 1);
					FileIndex.splice(n, 1);
				}

				var FV = GetFolderView(Ctrl, pt);
				if (FV) {
					var Selected = FV.Items(SVGIO_SELECTION | SVGIO_FLAG_VIEWORDER);
					var ar = Addons.XFinder.SetCommaText(ExtractMacro(Ctrl, line));
					if (ar.length) {
						if (!/\/|\\/.test(ar[0])) {
							FileList = [];
							FileIndex = [];
							if (!FileList.indexOf) {
								FileList.indexOf = function (s)
								{
									var n = FileList.length;
									for (var i = 0; i < n; i++) {
										if (s === FileList[i]) {
											return i;
										}
									}
									return -1;
								}
							}
							for (i = 0; i < Selected.length; i++) {
								strPath = Selected.Item(i).Path;
								if (strPath) {
									FileList.unshift(strPath);
									FileIndex.unshift(i);
								}
							}

							nMode = 0;
							for (i = 0; i < ar[0].length; i++) {
								if (ar[0].charAt(i) == '%') {
									while (i < ar[0].length && ar[0].charAt(i) < 'A') {
										i++;
									}
									if (api.strcmpi(ar[0].charAt(i), 's') == 0) {
										if (nMode == 0) {
											nMode = 1;
										}
										else if (nMode == 4) {
											nMode = 3;
										}
									}
									else if (nMode == 0) {
										nMode = 4;
									}
									else if (nMode == 1) {
										nMode = 2;
									}
								}
							}
							nStart = api.QuadPart(ar[1]);
							nInc = api.QuadPart(ar[2]) || 1;
							wsSrc = ar[3] || '';
							wsDist = ar[4] || '';
							if (nInc) {
								arFrom = [];
								arTo = [];
								while (FileList.length) {
									DoRename(0);
								}
								if (arFrom.length) {
									api.SHFileOperation(FO_MOVE, arFrom.join("\0") + "\0\0", arTo.join("\0") + "\0\0", FOF_ALLOWUNDO | FOF_MULTIDESTFILES, false);
								}
							}
						}
					}
				}
			}
/*
			: function (Ctrl, hwnd, pt, line)
			{
*/		},

		Env:
		{
			address: function (Ctrl, hwnd, pt, s)
			{
				SetAddress(s);
			 	return S_OK;
			},

			clipboard: function (Ctrl, hwnd, pt, s)
			{
				clipboardData.setData("text", s);
			 	return S_OK;
			},

			windowposition: function (Ctrl, hwnd, pt, s)
			{
				var rc = api.Memory("RECT");
				api.GetWindowRect(te.hwnd, rc);
				var pt = s.split(/,/);
				api.MoveWindow(te.hwnd, pt[0], pt[1], rc.right - rc.left, rc.bottom - rc.top, 0);
			 	return S_OK;
			},

			windowsize: function (Ctrl, hwnd, pt, s)
			{
				var rc = api.Memory("RECT");
				api.GetWindowRect(te.hwnd, rc);
				var size = s.split(/,/);
				api.MoveWindow(te.hwnd, rc.left, rc.top, size[0], size[1], 0);
			 	return S_OK;
			},

			timestamp: function (Ctrl, hwnd, pt, s)
			{
				var ar = Addons.XFinder.SetCommaText(s);
				for (var i = 1; i < ar.length; i++) {
					api.SetFileTime(ar[i], ar[0], null, null);
				}
			 	return S_OK;
			},

			tabname: function (Ctrl, hwnd, pt, s)
			{
				if (Addons.TabName) {
					var FV = GetFolderView(Ctrl, pt);
					if (FV) {
						Addons.TabName.Set(FV, s)
					}
				}
			},

			tabcolor: function (Ctrl, hwnd, pt, s)
			{
				if (Addons.TabColor) {
					var FV = GetFolderView(Ctrl, pt);
					if (FV) {
						var ar = Addons.XFinder.SetCommaText(s);
						Addons.TabColor.Set(FV, ar[0])
					}
				}
			},

			sortmode: function (Ctrl, hwnd, pt, s)
			{
				return Addons.XFinder.Command.sort(Ctrl, hwnd, pt, s);
			},

			viewmode:  function (Ctrl, hwnd, pt, s)
			{
				return Addons.XFinder.Command.viewstyle(Ctrl, hwnd, pt, s);
			},
			
			columns:  function (Ctrl, hwnd, pt, s)
			{
				return Addons.XFinder.Command.columns(Ctrl, hwnd, pt, s);
			}
		},
		
		Exec: function (Ctrl, hwnd, pt, line)
		{
			if (/^\/\//.test(line)) {
				return S_OK;
			}
			if (/^SW:(\d):(.*)/i.test(line)) {
				this.SW = api.LowPart(RegExp.$1);
				line = RegExp.$2;
			}
			if (line.match(/^(\d):(.*)/)) {
				this.nMode = api.LowPart(RegExp.$1);
				line = RegExp.$2;
			}
			if (line.match(/^(.+?):\s*(.*)\s*/)) {
				var fn = this.Command[RegExp.$1.toLowerCase()];
				if (fn) {
					return fn(Ctrl, hwnd, pt, RegExp.$2);
				}
			}
			switch (this.nMode) {
				case 0:
					Navigate(line, OpenMode);
					break;
				case 1:
					wsh.Run(ExtractMacro(Ctrl, line), this.SW);
					break;
				case 2:
					wsh.Run(ExtractMacro(Ctrl, line + " %Focused%"), this.SW);
					break;
				case 3:
				case 4:
					wsh.Run(ExtractMacro(Ctrl, line + " %Selected%"), this.SW);
					break;
			}
			return S_OK;
		},

		Popup: function (FV, re)
		{
			var hMenu = api.CreatePopupMenu();
			var ContextMenu = FV.ViewMenu();
			if (ContextMenu) {
				ContextMenu.QueryContextMenu(hMenu, 0, 1, 0x7FFF, CMF_DEFAULTONLY);
			}
			for (var i = api.GetMenuItemCount(hMenu); i--;) {
				var s = api.GetMenuString(hMenu, i, MF_BYPOSITION);
				if (s && s.match(re)) {
					var pt = api.Memory("POINT");
					api.GetCursorPos(pt);
					var nVerb = api.TrackPopupMenuEx(api.GetSubMenu(hMenu, i), TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null, null);
					if (nVerb) {
						ContextMenu.InvokeCommand(0, te.hwnd, nVerb - 1, null, null, SW_SHOWNORMAL, 0, 0);
					}
					break;
				}
			}
			api.DestroyMenu(hMenu);
		},

		SetCommaText: function (s)
		{
			return api.CommandLineToArgv(s.replace(/,/g, " "));
		},

		Run: function (Item, FV, s)
		{
			var hMenu = api.CreatePopupMenu();
			var ContextMenu = api.ContextMenu(Item);
			if (ContextMenu) {
				ContextMenu.QueryContextMenu(hMenu, 0, 1, 0x7FFF, CMF_DEFAULTONLY);
				s = ExtractMacro(FV, s);
				if (api.strcmpi(s, Default) == 0) {
					s = null;
				}
				ContextMenu.InvokeCommand(0, te.hwnd, s, null, null, SW_SHOWNORMAL, 0, 0);
			}
			api.DestroyMenu(hMenu);
		}
	};

	AddEnv("X-Finder", function(Ctrl)
	{
		return (fso.GetParentFolderName(api.GetModuleFileName(null)) + "\\").replace(/\\\\$/, "\\");
	});

	AddEnv("Focused", function(Ctrl)
	{
		var FV = GetFolderView(Ctrl);
		if (FV) {
			var Focused = FV.FocusedItem;
			if (Focused) {
				return api.GetDisplayNameOf(Focused, SHGDN_FORPARSING);
			}
		}
	});

	AddEnv("FocusedName", function(Ctrl)
	{
		var FV = GetFolderView(Ctrl);
		if (FV) {
			var Focused = FV.FocusedItem;
			if (Focused) {
				return fso.GetFileName(api.GetDisplayNameOf(Focused, SHGDN_FORPARSING));
			}
		}
	});

	AddEnv("InstallDrive", function(Ctrl)
	{
		return fso.GetDriveName(api.GetModuleFileName(null));
	});

	AddEnv("sysdir", function(Ctrl)
	{
		return system32;
	});

	AddEnv("CurrentSelected", function(Ctrl)
	{
		var ar = [];
		var FV = GetFolderView(Ctrl);
		if (FV) {
			var Selected = FV.Items(SVGIO_SELECTION | SVGIO_FLAG_VIEWORDER);
			if (Selected) {
				for (var i = Selected.Count; i > 0; ar.unshift(api.PathQuoteSpaces(api.GetDisplayNameOf(Selected.Item(--i), SHGDN_FORPARSING)))) {
				}
			}
		}
		return ar.join(" ");
	});

	AddEnv("Other", function(Ctrl)
	{
		var TC = te.Ctrl(CTRL_TC);
		var cTC = te.Ctrls(CTRL_TC);
		for (var i = cTC.Count; i--;) {
			if (cTC[i].Visible && cTC[i].Id != TC.Id) {
				return api.PathQuoteSpaces(api.GetDisplayNameOf(cTC[i].Selected, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING));
			}
		}
	});

	AddEnv("SendTo", function(Ctrl)
	{
		return api.GetDisplayNameOf(ssfSENDTO, SHGDN_FORPARSING);
	});

	AddEnv("FileContents", function(Ctrl)
	{
		var s = "";
		var FV = GetFolderView(Ctrl);
		if (FV) {
			var Focused = FV.FocusedItem;
			if (Focused) {
				try {
					var ts = fso.OpenTextFile(Focused.Path, 1);
					if (!ts.AtEndOfStream) {
						s = ts.ReadAll();
					}
					ts.Close();
				}
				catch (e) {
					wsh.Echo(Focused.Path);
				}
			}
		}
		return s;
	});

	AddEnv("Clipboard", function(Ctrl)
	{
		var s = clipboardData.getData("text");
		if (!s) {
			s = "";
			var Items = api.OleGetClipboard();
			for (var i = 0; i < Items.Count; i++) {
				s += api.GetDisplayNameOf(Items.Item(i), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING) + "\n";
			}
		}
		return s;
	});

	AddEnv("Clipboard1", function(Ctrl)
	{
		var s = clipboardData.getData("text");
		if (!s) {
			s = [];
			var Items = api.OleGetClipboard();
			for (var i = 0; i < Items.Count; i++) {
				s.push(api.PathQuoteSpaces(api.GetDisplayNameOf(Items.Item(i), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING)));
			}
			return s.join(" ");
		}
		return s.replace(/[\r\n]/g, " ");
	});

	AddEnv("Attrib", function(Ctrl)
	{
		var s = [];
		var FV = GetFolderView(Ctrl);
		if (FV) {
			var FindData = api.Memory("WIN32_FIND_DATA");
			api.SHGetDataFromIDList(FV.FocusedItem, SHGDFIL_FINDDATA, FindData, FindData.Size);
			var a = {R: FILE_ATTRIBUTE_READONLY, A:FILE_ATTRIBUTE_ARCHIVE, S:FILE_ATTRIBUTE_SYSTEM, H:FILE_ATTRIBUTE_HIDDEN};
			for (var i in a) {
				s.push((FindData.dwFileAttributes & a[i] ? "+" : "-") + i);
			}
		}
		return s.join(" ");
	});

	AddEnv("TabName", function(Ctrl)
	{
		var FV = GetFolderView(Ctrl);
		if (FV) {
			return GetTabName(FV);
		}
	});

	AddEnv("TabColor", function(Ctrl)
	{
		var FV = GetFolderView(Ctrl);
		if (FV) {
			return RunEvent4("GetTabColor", FV);
		}
	});

	AddEvent("ReplaceMacro", [/%DateTime:([^%]*%)/ig, function (Ctrl)
	{
		try {
			var vb = api.GetScriptDispatch('Function fn()\n fn = CStr(Now())\nEnd Function', "VBScript");
			return vb.fn();
		}
		catch (e) {
			return new Date().toLocaleString();
		}
	}]);

	AddEvent("ReplaceMacro", [/%TimeStamp:([^%]*)%/ig, function (Ctrl, re)
	{
		var FV = GetFolderView(Ctrl, pt);
		if (FV) {
			try {
				var vb = api.GetScriptDispatch('Function fn(s)\n fn = FormatDateTime(s)\nEnd Function', "VBScript");
				return vb.fn(FV.FocusedItem.ModifyDate);
			}
			catch (e) {
				return new Date().toLocaleString();
			}
		}
	}]);

	AddEvent("ExtractMacro", [/%([^%]+)%/, function (Ctrl, s, re)
	{
		var s1 = te.Data.XFEnv[RegExp.$1.toLowerCase()];
		if (s1 !== undefined) {
			return s.replace("%" + RegExp.$1 + "%", s1);
		}
		return s;
	}]);

	AddType("X-Finder",
	{
		Exec: function (Ctrl, s, type, hwnd, pt)
		{
			Addons.XFinder.nMode = 1;
			var lines = s.split(/\n/);
			for (var i in lines) {
				if (Addons.XFinder.Exec(Ctrl, hwnd, pt, lines[i]) != S_OK) {
					break;
				}
			}
		},

		Ref: function (s, pt)
		{
			var ar = [];
			for (var i in Addons.XFinder.Command) {
				ar.push(i.replace(/^[a-z]/g, function (s){ return s.toUpperCase();}) + ":");
			}
			ar.sort();
			return g_basic.Popup(ar, s, pt);
		}

	});

	if (!te.Data.XFEnv) {
		te.Data.XFEnv = {};
	}
}
