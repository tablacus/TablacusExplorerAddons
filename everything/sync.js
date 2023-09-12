const Addon_Id = "everything";
const item = GetAddonElement(Addon_Id);

Sync.Everything = {
	PATH: "es:",
	strName: item.getAttribute("MenuName") || "Everything",
	nPos: GetNum(item.getAttribute("MenuPos")),
	Max: GetNum(item.getAttribute("Folders")) || 1000,
	RE: GetNum(item.getAttribute("RE")),
	Class: item.getAttribute("Class") || "EVERYTHING_TASKBAR_NOTIFICATION",
	fncb: {},
	nDog: 0,

	IsHandle: function (Ctrl) {
		return api.PathMatchSpec("string" === typeof Ctrl ? Ctrl : api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING), Sync.Everything.PATH + "*");
	},

	GetSearchString: function (Ctrl) {
		const Path = "string" === typeof Ctrl ? Ctrl : api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
		if (Sync.Everything.IsHandle(Path)) {
			return Path.replace(new RegExp("^" + Sync.Everything.PATH, "i"), "").replace(/^\s+|\s+$/g, "");
		}
		return "";
	},

	Delete: function (pidl) {
		const cFV = te.Ctrls(CTRL_FV);
		for (let i in cFV) {
			const FV = cFV[i];
			if (FV.hwnd && this.IsHandle(FV)) {
				FV.RemoveItem(pidl);
			}
		}
	},

	Rename: function (pidl, pidl2) {
		const cFV = te.Ctrls(CTRL_FV);
		for (let i in cFV) {
			const FV = cFV[i];
			if (FV.hwnd && this.IsHandle(FV)) {
				if (Sync.Everything.IsHandle(FV)) {
					if (FV.RemoveItem(pidl) == S_OK) {
						FV.AddItem(api.GetDisplayNameOf(pidl2, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING));
					}
				}
			}
		}
	},

	Enum: function (pid, Ctrl, fncb, SessionId) {
		if (fncb) {
			let Path = Sync.Everything.GetSearchString(pid);
			if (Sync.Everything.RE) {
				const ar = []
				for (let ar2 = Path.split(" "); ar2.length;) {
					let s = ar2.shift();
					if (/^\\\\|:/.test(s)) {
						if (/"/.test(s)) {
							while (ar2.length) {
								const s2 = ar2.shift();
								s += " " + s2;
								if (/"/.test(s2)) {
									break;
								}
							}
						}
					} else {
						s = 'regex:' + ((window.migemo && migemo.query(s)) || s);
					}
					ar.push(s);
				}
				Path = ar.join(" ");
			}
			if (Path) {
				const hwndView = Ctrl.hwndView;
				Sync.Everything.fncb[Ctrl.Id] = fncb;
				if (!Sync.Everything.Open(Path, hwndView) && Sync.Everything.ExePath) {
					if (Sync.Everything.nDog++ < 9) {
						try {
							wsh.Run(ExtractMacro(te, Sync.Everything.ExePath), SW_SHOWNORMAL);
							setTimeout(function () {
								Sync.Everything.Enum(pid, Ctrl, fncb, SessionId);
							}, Sync.Everything.nDog * 99);
						} catch (e) { }
					} else {
						Sync.Everything.nDog = 0;
					}
				}
			}
		}
	},

	Open: function (Path, hwndView) {
		if (Sync.Everything.Busy) {
			return;
		}
		Sync.Everything.Busy = true;
		const hwnd = api.FindWindow(Sync.Everything.Class, null);
		if (hwnd) {
			const query = new ApiStruct({
				reply_hwnd: [VT_I4, 4],
				reply_copydata_message: [VT_I4, 4],
				search_flags: [VT_I4, api.sizeof("DWORD")],
				offset: [VT_I4, api.sizeof("DWORD")],
				max_results: [VT_I4, api.sizeof("DWORD")],
				search_string: [VT_LPWSTR, api.sizeof("WCHAR"), Path.length + 1]
			}, 4);
			query.Write("reply_hwnd", hwndView);
			query.Write("reply_copydata_message", 2);
			query.Write("max_results", Sync.Everything.Max);
			query.Write("search_string", Path);

			const cds = api.Memory("COPYDATASTRUCT");
			cds.cbData = query.Size;
			cds.dwData = 2;//EVERYTHING_IPC_COPYDATAQUERY;
			cds.lpData = query.Memory;
			api.SendMessageTimeout(hwnd, WM_COPYDATA, hwndView, cds, 2, 9999);
		}
		Sync.Everything.Busy = false;
		return hwnd;
	}

};

AddEvent("TranslatePath", function (Ctrl, Path) {
	if (Sync.Everything.IsHandle(Path)) {
		Ctrl.Enum = Sync.Everything.Enum;
		return ssfRESULTSFOLDER;
	}
}, true);

AddEvent("CopyData", function (Ctrl, cd, wParam) {
	if (cd.dwData == 2 && cd.cbData) {
		const data = api.Memory("BYTE", cd.cbData, cd.lpData);
		const EVERYTHING_IPC_LIST = {
			totfolders: [VT_I4, api.sizeof("DWORD")],
			totfiles: [VT_I4, api.sizeof("DWORD")],
			totitems: [VT_I4, api.sizeof("DWORD")],
			numfolders: [VT_I4, api.sizeof("DWORD")],
			numfiles: [VT_I4, api.sizeof("DWORD")],
			numitems: [VT_I4, api.sizeof("DWORD")],
			offset: [VT_I4, api.sizeof("DWORD")]
		};
		const list = new ApiStruct(EVERYTHING_IPC_LIST, 4, data);
		const nItems = Math.min(list.Read("totitems"), Sync.Everything.Max || 2 ^ 53 - 1);
		const EVERYTHING_IPC_ITEM = {
			flags: [VT_I4, api.sizeof("DWORD")],
			filename_offset: [VT_I4, api.sizeof("DWORD")],
			path_offset: [VT_I4, api.sizeof("DWORD")]
		};
		const arItems = [];
		let item = new ApiStruct(EVERYTHING_IPC_ITEM, 4);
		const itemSize = item.Size;
		for (let i = 0; i < nItems && api.GetAsyncKeyState(VK_ESCAPE) >= 0; i++) {
			item = new ApiStruct(EVERYTHING_IPC_ITEM, 4, api.Memory("BYTE", itemSize, cd.lpData + list.Size + list.Read("offset") + itemSize * i));
			arItems.push(data.Read(item.Read("path_offset"), VT_LPWSTR) + "\\" + data.Read(item.Read("filename_offset"), VT_LPWSTR));
		}
		Sync.Everything.fncb[Ctrl.Id](Ctrl, arItems);
		delete Sync.Everything.fncb[Ctrl.Id];
		Sync.Everything.nDog = 0;
		return S_OK;
	}
});

AddEvent("GetFolderItemName", function (pid) {
	if (Sync.Everything.IsHandle(pid)) {
		const res = /(.*?) *path:"?.+?"?/.exec(pid.Path);
		return res ? res[1] : pid.Path;
	}
}, true);

AddEvent("GetIconImage", function (Ctrl, clBk, bSimple) {
	if (Sync.Everything.IsHandle(Ctrl)) {
		return MakeImgDataEx(Sync.Everything.Icon, bSimple, 16, clBk);
	}
});

AddEvent("Context", function (Ctrl, hMenu, nPos, Selected, item, ContextMenu) {
	if (Sync.Everything.IsHandle(Ctrl)) {
		api.InsertMenu(hMenu, -1, MF_BYPOSITION | MF_STRING, ++nPos, api.LoadString(hShell32, 31368));
		ExtraMenuCommand[nPos] = OpenContains;
	}
	return nPos;
});

AddEvent("InvokeCommand", function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon) {
	if (!Verb || Verb == CommandID_STORE - 1) {
		if (ContextMenu.Items.Count >= 1) {
			const path = api.GetDisplayNameOf(ContextMenu.Items.Item(0), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
			if (Sync.Everything.IsHandle(path)) {
				const FV = te.Ctrl(CTRL_FV);
				FV.Navigate(path, SBSP_SAMEBROWSER);
				return S_OK;
			}
		}
	}
});

AddEvent("ChangeNotify", function (Ctrl, pidls) {
	if (pidls.lEvent & (SHCNE_DELETE | SHCNE_RMDIR)) {
		Sync.Everything.Delete(pidls[0]);
	}
	if (pidls.lEvent & (SHCNE_RENAMEFOLDER | SHCNE_RENAMEITEM)) {
		Sync.Everything.Rename(pidls[0], pidls[1]);
	}
});

AddEvent("ILGetParent", function (FolderItem) {
	if (Sync.Everything.IsHandle(FolderItem)) {
		const res = /path:"?(.+?)"?/.exec(Sync.Everything.GetSearchString(FolderItem));
		return res ? res[1] : ssfDESKTOP;
	}
});

Sync.Everything.ExePath = ExtractMacro(te, item.getAttribute("Exec"));
if (!Sync.Everything.ExePath) {
	let path = fso.BuildPath(api.GetDisplayNameOf(ssfPROGRAMFILES, SHGDN_FORPARSING), "Everything\\Everything.exe");
	if (!fso.FileExists(path)) {
		path = path.replace(/ \(x86\)\\/, "\\");
	}
	if (fso.FileExists(path)) {
		Sync.Everything.ExePath = PathQuoteSpaces(path) + " -startup";
	}
}
let icon = ExtractPath(te, item.getAttribute("Icon"));
if (!icon) {
	if (Sync.Everything.ExePath) {
		const path = ExtractPath(te, Sync.Everything.ExePath.replace(/\s*\-startup$/, ""));
		if (fso.FileExists(path)) {
			icon = 'icon:' + path + ',0';
		}
	}
	if (!icon) {
		icon = "icon:general,17";
	}
}
Sync.Everything.Icon = icon;

//Menu
if (item.getAttribute("MenuExec")) {
	AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos) {
		api.InsertMenu(hMenu, Sync.Everything.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Sync.Everything.strName));
		ExtraMenuCommand[nPos] = Sync.Everything.Exec;
		return nPos;
	});
}

AddTypeEx("Add-ons", "Everything", Sync.Everything.Exec);
