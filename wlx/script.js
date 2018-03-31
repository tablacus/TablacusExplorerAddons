var Addon_Id = "wlx";
var item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", -1);
	item.setAttribute("Menu", "Context");
	item.setAttribute("MenuPos", -1);
	item.setAttribute("KeyExec", 1);
	item.setAttribute("KeyOn", "List");
	item.setAttribute("Key", "Ctrl+Q");
}
if (window.Addon == 1) {
	Addons.WLX =
	{
		DLL: api.DllGetClassObject(fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), ["addons\\wlx\\twlx", api.sizeof("HANDLE") * 8, ".dll"].join("")), "{E160213A-4E9E-44f3-BD39-8297499608B6}"),

		X: [],
		IN: [],
		PATH: "wlx:",
		xml: OpenXml("wlx.xml", false, true),

		Init: function ()
		{
			if (Addons.WLX.DLL) {
				var items = Addons.WLX.xml.getElementsByTagName("Item");
				for (var i = 0; i < items.length; i++) {
					var item1 = items[i];
					var dllPath = (ExtractMacro(te, api.PathUnquoteSpaces(item1.getAttribute("Path"))) + (api.sizeof("HANDLE") > 4 ? "64" : "")).replace(/\.u(wlx64)$/, ".$1");
					var WLX = Addons.WLX.DLL.open(dllPath);
					if (WLX && WLX.ListLoad) {
						if (WLX.ListGetDetectString) {
							Addons.WLX.X.unshift({X: WLX, CC: WLX.ListGetDetectString() || "force", Fit: item1.getAttribute("Fit") });
						} else {
							Addons.WLX.X.unshift({X: WLX, CC: "force", Fit: item1.getAttribute("Fit") });
						}
						if (WLX.ListSetDefaultParams) {
							WLX.ListSetDefaultParams(fso.BuildPath(te.Data.DataFolder, "config\\lsplugin.ini"));
						}
						if (WLX.ListGetPreviewBitmap) {
							Addons.WLX.IN.unshift(WLX);
						}
					}
				}
			}
		},

		GetPath: function (Ctrl)
		{
			var res = /^wlx:\s*(.+)/i.exec(typeof(Ctrl) == "string" ? Ctrl : api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL));
			return res ? res[1] : null;
		},

		GetObject: function (Ctrl, mode2, fn)
		{
			var res;
			if (Addons.WLX.X.length) {
				if (/string/i.test(typeof Ctrl) || !IsFolderEx(Ctrl)) {
					var path = /string/i.test(typeof Ctrl) ? Ctrl : api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
					path = path.replace(/^wlx:/i, "");
					var ext = fso.GetExtensionName(path).toUpperCase();
					var data = null;
					if (/^[A-Z]:\\.+|^\\.+\\.+/i.test(path)) {
						var skip = [];
						var mode = true;
						do {
							mode = !mode;
							for (var i = Addons.WLX.X.length; i--;) {
								if (skip[i]) {
									continue;
								}
								var cc = Addons.WLX.X[i].CC;
								var js = '', dog = 999;
								while (cc.length && dog--) {
									res = /^[\s\(\)\|\&]/.exec(cc);
									if (res) {
										js += res[0];
										cc = cc.substr(res[0].length);
									}
									res = /^ext="([^"]*)"/i.exec(cc);
									if (res) {
										js += (ext == res[1]);
										cc = cc.substr(res[0].length);
									}
									res = /^size"/i.exec(cc);
									if (res) {
										js += fso.GetFile(path).Size;
										cc = cc.substr(res[0].length);
									}
									res = /^\[(\d+)\]="([^"])"/i.exec(cc);
									if (res) {
										if (!data) {
											data = Addons.WLX.GetHeader(path);
										}
										js += data && (data[res[1]] == res[2].charCodeAt(0));
										cc = cc.substr(res[0].length);
									}
									res = /^\[(\d+)\]=(\d+)/i.exec(cc);
									if (res) {
										if (!data) {
											data = Addons.WLX.GetHeader(path);
										}
										js += (data[res[1]] == res[2]);
										cc = cc.substr(res[0].length);
									}
									res = /^find\("([^"]*)"\)/i.exec(cc);
									if (res) {
										if (!data) {
											data = Addons.WLX.GetHeader(path);
										}
										var str = data.Read(0, VT_LPWSTR, data.Count / 2);
										js += String(str.indexOf(res[1]) >= 0);
										cc = cc.substr(res[0].length);
									}
									res = /^findi\("([^"]*)"\)/i.exec(cc);
									if (res) {
										if (!data) {
											data = Addons.WLX.GetHeader(path);
										}
										var str = data.Read(0, VT_LPWSTR, data.Count / 2);
										js += String(str.toLowerCase().indexOf(res[1].toLowerCase()) >= 0);
										cc = cc.substr(res[0].length);
									}
									res = /^force|^multimedia/i.exec(cc);
									if (res) {
										js += !!mode;
										cc = cc.substr(res[0].length);
									}
								}
								if (js) {
									try {
										if (new Function('return ' + js)()) {
											skip[i] = true;
											var WLX = Addons.WLX.X[i].X;
											if (WLX && fn) {
												var fit = Addons.WLX.X[i].Fit;
												if (fn(WLX, path, fit)) {
													return WLX;
												}
											} else {
												return WLX;
											}
										}
									} catch (e) {
										alert(js);
									}
								}
							}
						} while (mode != mode2)
					}
				}
			}
		},

		GetHeader: function (path)
		{
			ado = te.CreateObject(api.ADBSTRM);
			try {
				ado.Type = adTypeBinary;
				ado.Open();
				ado.LoadFromFile(path);
				dw = ado.Read(8192);
			} catch (e) {
				dw = undefined;
			}
			ado.Close();
			return api.Memory(dw);
		},

		Exec: function (Ctrl, pt)
		{
			var FV = GetFolderView(Ctrl, pt);
			var Selected = FV.SelectedItems();
			if (Selected && Selected.Count) {
				var pid = Selected.Item(0);
				var WLX = Addons.WLX.GetObject(pid, true);
				if (WLX) {
					FV.Navigate(Addons.WLX.PATH + pid.Path, SBSP_NEWBROWSER);
				}
			}
			return S_OK;
		},

		Close: function (FV, bSuspend)
		{
			if (FV.Data.WLX) {
				if (FV.Data.WLX.X.ListCloseWindow) {
					FV.Data.WLX.X.ListCloseWindow(FV.Data.WLX.hwnd);
				} else {
					api.PostMessage(FV.Data.WLX.hwnd, WM_CLOSE, 0, 0);
				}
				delete FV.Data.WLX;
				FV.hwndAlt = null;
				if (bSuspend) {
					FV.Suspend();
				}
			}
		},

		Finalize: function ()
		{
			var cFV = te.Ctrls(CTRL_FV);
			for (var i in cFV) {
				Addons.WLX.Close(cFV[i], true);
			}
			delete Addons.WLX.IN;
			delete Addons.WLX.X;
			CollectGarbage();
			delete Addons.WLX.DLL;
		}
	};

	AddEvent("Load", function ()
	{
		Addons.WLX.Init();

		if (Addons.WLX.IN.length) {
			AddEvent("FromFile", function (image, file, alt, cx)
			{
				var i, dw, ado, hbm;
				if (Addons.WLX.IN.length && /^[A-Z]:\\.+|^\\.+\\.+/i.test(file)) {
					ado = te.CreateObject(api.ADBSTRM);
					try {
						ado.Type = adTypeBinary;
						ado.Open();
						ado.LoadFromFile(file);
						dw = ado.Read(8192);
					} catch (e) {
						dw = undefined;
					}
					ado.Close();
					if (dw !== undefined) {
						for (i = Addons.WLX.IN.length; i-- > 0;) {
							hbm = Addons.WLX.IN[i].ListGetPreviewBitmap(file, cx || 1024, cx || 1024, dw);
							if (hbm) {
								image.FromHBITMAP(hbm);
								api.DeleteObject(hbm);
								return S_OK;
							}
						}
					}
				}
			});
		}

		if (Addons.WLX.X.length) {
			AddEvent("TranslatePath", function (Ctrl, Path)
			{
				if (Addons.WLX.GetPath(Path)) {
					return ssfRESULTSFOLDER;
				}
			}, true);

			AddEvent("NavigateComplete", function (Ctrl)
			{
				if (Ctrl && Addons.WLX.X.length) {
					if (Addons.WLX.GetPath(Ctrl)) {
						Addons.WLX.Close(Ctrl);
						Addons.WLX.GetObject(Ctrl.FolderItem, true, function (WLX, path, Fit)
						{
							var hwnd = WLX.ListLoad(Ctrl.hwndView, path, Fit ? 50 : 32);
							if (hwnd) {
								Ctrl.hwndAlt = hwnd;1
								Ctrl.Data.WLX = { X: WLX, hwnd: hwnd };
								var Items = te.FolderItems();
								Items.AddItem(path);
								Ctrl.AltSelectedItems = Items;
							}
							return hwnd;
						});
					}
				}
			});

			AddEvent("Close", function (Ctrl)
			{
				if (Ctrl.Data) {
					Addons.WLX.Close(Ctrl);
				}
			});

			AddEvent("ILGetParent", function (FolderItem)
			{
				var path = Addons.WLX.GetPath(FolderItem);
				if (path) {
					return path + "\\..";
				}
			});

			AddEvent("GetIconImage", function (Ctrl, BGColor)
			{
				if (document.documentMode) {
					var path = Addons.WLX.GetPath(Ctrl.FolderItem);
					if (path) {
						var sfi = api.Memory("SHFILEINFO");
						api.SHGetFileInfo(path, 0, sfi, sfi.Size, SHGFI_ICON | SHGFI_SMALLICON);
						if (sfi.hIcon) {
							var image = te.WICBitmap().FromHICON(sfi.hIcon);
							api.DestroyIcon(sfi.hIcon);
							if (image) {
								return image.DataURI("image/png");
							}
						}
					}
				}
			});
		}

		AddEvent("Finalize", Addons.WLX.Finalize);

		AddEvent("AddonDisabled", function (Id)
		{
			if (Id.toLowerCase() == "wlx") {
				Addons.WLX.Finalize();
			}
		});
	});
	Addons.WLX.strName = item.getAttribute("MenuName") || api.LoadString(hShell32, 23887) || GetText("Content");
	//Menu
	if (item.getAttribute("MenuExec")) {
		Addons.WLX.nPos = api.LowPart(item.getAttribute("MenuPos"));
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
		{
			var FV = GetFolderView(Ctrl);
			var Selected = FV.SelectedItems();
			if (Selected && Selected.Count) {
				var pid = Selected.Item(0);
				var WLX = Addons.WLX.GetObject(pid, true);
				if (WLX) {
					api.InsertMenu(hMenu, Addons.WLX.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Addons.WLX.strName));
					ExtraMenuCommand[nPos] = Addons.WLX.Exec;
				}
			}
			return nPos;
		});
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.WLX.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.WLX.Exec, "Func");
	}
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}