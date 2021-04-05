const Addon_Id = "wlx";
const item = GetAddonElement(Addon_Id);

Sync.WLX = {
	DLL: api.DllGetClassObject(BuildPath(te.Data.Installed, ["addons\\wlx\\twlx", g_.bit, ".dll"].join("")), "{E160213A-4E9E-44f3-BD39-8297499608B6}"),
	strName: item.getAttribute("MenuName") || api.LoadString(hShell32, 23887) || GetText("Content"),

	X: [],
	IN: [],
	PATH: "wlx:",
	xml: OpenXml("wlx.xml", false, true),

	Init: function () {
		if (Sync.WLX.DLL) {
			const items = Sync.WLX.xml.getElementsByTagName("Item");
			for (let i = 0; i < items.length; i++) {
				const item1 = items[i];
				const dllPath = (ExtractPath(te, item1.getAttribute("Path")) + (api.sizeof("HANDLE") > 4 ? "64" : "")).replace(/\.u(wlx64)$/, ".$1");
				const WLX = Sync.WLX.DLL.Open(dllPath);
				if (WLX && WLX.ListLoad) {
					if (WLX.ListGetDetectString) {
						Sync.WLX.X.unshift({ X: WLX, CC: WLX.ListGetDetectString() || "force", Fit: item1.getAttribute("Fit") });
					} else {
						Sync.WLX.X.unshift({ X: WLX, CC: "force", Fit: item1.getAttribute("Fit") });
					}
					if (WLX.ListSetDefaultParams) {
						WLX.ListSetDefaultParams(fso.BuildPath(te.Data.DataFolder, "config\\lsplugin.ini"));
					}
					if (WLX.ListGetPreviewBitmap) {
						Sync.WLX.IN.unshift(WLX);
					}
				}
			}
		}
	},

	GetPath: function (Ctrl) {
		const res = /^wlx:\s*(.+)/i.exec(typeof (Ctrl) == "string" ? Ctrl : api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL));
		return res ? res[1] : null;
	},

	GetObject: function (Ctrl, mode2, fn) {
		let res;
		if (Sync.WLX.X.length) {
			if (/string/i.test(typeof Ctrl) || !IsFolderEx(Ctrl) || api.ILIsEqual((Ctrl.FolderItem || Ctrl).Alt, ssfRESULTSFOLDER)) {
				let path = /string/i.test(typeof Ctrl) ? Ctrl : api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
				path = path.replace(/^wlx:/i, "");
				const ext = fso.GetExtensionName(path).toUpperCase();
				let data = null;
				if (/^[A-Z]:\\.+|^\\.+\\.+/i.test(path)) {
					const skip = [];
					let mode = true;
					do {
						mode = !mode;
						for (let i = Sync.WLX.X.length; i--;) {
							if (skip[i]) {
								continue;
							}
							let cc = Sync.WLX.X[i].CC;
							let js = '', dog = 999;
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
										data = Sync.WLX.GetHeader(path);
									}
									js += data && (data[res[1]] == res[2].charCodeAt(0));
									cc = cc.substr(res[0].length);
								}
								res = /^\[(\d+)\]=(\d+)/i.exec(cc);
								if (res) {
									if (!data) {
										data = Sync.WLX.GetHeader(path);
									}
									js += (data[res[1]] == res[2]);
									cc = cc.substr(res[0].length);
								}
								res = /^find\("([^"]*)"\)/i.exec(cc);
								if (res) {
									if (!data) {
										data = Sync.WLX.GetHeader(path);
									}
									const str = data.Read(0, VT_LPWSTR, data.Count / 2);
									js += String(str.indexOf(res[1]) >= 0);
									cc = cc.substr(res[0].length);
								}
								res = /^findi\("([^"]*)"\)/i.exec(cc);
								if (res) {
									if (!data) {
										data = Sync.WLX.GetHeader(path);
									}
									const str = data.Read(0, VT_LPWSTR, data.Count / 2);
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
										const WLX = Sync.WLX.X[i].X;
										if (WLX && fn) {
											const fit = Sync.WLX.X[i].Fit;
											if (fn(WLX, path, fit)) {
												return WLX;
											}
										} else {
											return WLX;
										}
									}
								} catch (e) {
									ShowError(e, ["Error: WLX", js].join("\n"));
								}
							}
						}
					} while (mode != mode2)
				}
			}
		}
	},

	GetHeader: function (path) {
		const pStream = api.SHCreateStreamOnFileEx(path, STGM_READ | STGM_SHARE_DENY_NONE, FILE_ATTRIBUTE_NORMAL, false, null);
		if (pStream) {
			const dw = api.Memory(pStream, 8192);
			pStream.Free();
			return dw;
		}
	},

	Exec: function (Ctrl, pt) {
		const FV = GetFolderView(Ctrl, pt);
		const Selected = FV.SelectedItems();
		if (Selected && Selected.Count) {
			const pid = Selected.Item(0);
			const WLX = Sync.WLX.GetObject(pid, true);
			if (WLX) {
				FV.Navigate(Sync.WLX.PATH + pid.Path, SBSP_NEWBROWSER);
			}
		}
		return S_OK;
	},

	Close: function (FV, bSuspend) {
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

	Finalize: function () {
		const cFV = te.Ctrls(CTRL_FV);
		for (let i in cFV) {
			Sync.WLX.Close(cFV[i], true);
		}
		delete Sync.WLX.IN;
		delete Sync.WLX.X;
		CollectGarbage();
		delete Sync.WLX.DLL;
	}
};

AddEvent("Load", function () {
	Sync.WLX.Init();

	if (Sync.WLX.IN.length) {
		AddEvent("FromFile", function (image, file, alt, cx) {
			let data, hbm, dw;
			if (Sync.WLX.IN.length && /^[A-Z]:\\.+|^\\.+\\.+/i.test(file)) {
				data = Sync.WLX.GetHeader(file);
				if (data) {
					dw = data.Read(0, VT_ARRAY | VT_I1, 8192);
					delete data;
					for (let i = Sync.WLX.IN.length; i-- > 0;) {
						hbm = Sync.WLX.IN[i].ListGetPreviewBitmap(file, cx || 1024, cx || 1024, dw);
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

	if (Sync.WLX.X.length) {
		AddEvent("TranslatePath", function (Ctrl, Path) {
			if (Sync.WLX.GetPath(Path)) {
				return ssfRESULTSFOLDER;
			}
		}, true);

		AddEvent("NavigateComplete", function (Ctrl) {
			if (Ctrl && Sync.WLX.X.length) {
				if (Sync.WLX.GetPath(Ctrl)) {
					Sync.WLX.Close(Ctrl);
					Sync.WLX.GetObject(Ctrl.FolderItem, true, function (WLX, path, Fit) {
						const hwnd = WLX.ListLoad(Ctrl.hwndView, path, Fit ? 50 : 32);
						if (hwnd) {
							Ctrl.hwndAlt = hwnd;
							Ctrl.Data.WLX = { X: WLX, hwnd: hwnd };
							const Items = te.FolderItems();
							Items.AddItem(path);
							Ctrl.AltSelectedItems = Items;
						}
						return hwnd;
					});
				}
			}
		});

		AddEvent("Close", function (Ctrl) {
			if (Ctrl.Data) {
				Sync.WLX.Close(Ctrl);
			}
		});

		AddEvent("ILGetParent", function (FolderItem) {
			const path = Sync.WLX.GetPath(FolderItem);
			if (path) {
				return path + "\\..";
			}
		});

		AddEvent("GetIconImage", function (Ctrl) {
			if (g_.IEVer >= 8) {
				const path = Sync.WLX.GetPath(Ctrl.FolderItem);
				if (path) {
					const sfi = api.Memory("SHFILEINFO");
					api.SHGetFileInfo(path, 0, sfi, sfi.Size, SHGFI_ICON | SHGFI_SMALLICON);
					if (sfi.hIcon) {
						const image = api.CreateObject("WICBitmap").FromHICON(sfi.hIcon);
						api.DestroyIcon(sfi.hIcon);
						if (image) {
							return image.DataURI("image/png");
						}
					}
				}
			}
		});
	}

	AddEvent("Finalize", Sync.WLX.Finalize);

	AddEvent("AddonDisabled", function (Id) {
		if (Id.toLowerCase() == "wlx") {
			Sync.WLX.Finalize();
		}
	});
});
//Menu
if (item.getAttribute("MenuExec")) {
	Sync.WLX.nPos = GetNum(item.getAttribute("MenuPos"));
	AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos) {
		const FV = GetFolderView(Ctrl);
		const Selected = FV.SelectedItems();
		if (Selected && Selected.Count) {
			const pid = Selected.Item(0);
			const WLX = Sync.WLX.GetObject(pid, true);
			if (WLX) {
				api.InsertMenu(hMenu, Sync.WLX.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Sync.WLX.strName));
				ExtraMenuCommand[nPos] = Sync.WLX.Exec;
			}
		}
		return nPos;
	});
}
//Key
if (item.getAttribute("KeyExec")) {
	SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Sync.WLX.Exec, "Func");
}
//Mouse
if (item.getAttribute("MouseExec")) {
	SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Sync.WLX.Exec, "Func");
}
