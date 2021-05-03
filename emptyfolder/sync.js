const Addon_Id = "emptyfolder";
const item = GetAddonElement(Addon_Id);

Sync.EmptyFolder = {
	PATH: "emptyfolder:",
	Icon: item.getAttribute("Icon") || "folder:closed",
	iCaret: -1,
	strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
	nPos: GetNum(item.getAttribute("MenuPos")),

	GetSearchString: function (Ctrl) {
		if (Ctrl) {
			const res = new RegExp("^" + Sync.EmptyFolder.PATH + "\\s*(.*)", "i").exec(api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING));
			if (res) {
				return res[1];
			}
		}
		return "";
	},

	Exec: function (Ctrl, pt) {
		const FV = GetFolderView(Ctrl, pt);
		if (FV) {
			FV.Focus();
			const ar = [];
			const Selected = FV.SelectedItems();
			if (Selected && Selected.Count) {
				for (let i = Selected.Count; i--;) {
					const path = api.GetDisplayNameOf(Selected.Item(i), SHGDN_FORPARSING);
					if (/^[A-Z]:\\|^\\/i.test(path)) {
						ar.unshift(path);
					}
				}
			} else {
				const path = api.GetDisplayNameOf(FV, SHGDN_FORPARSING);
				if (/^[A-Z]:\\|^\\/i.test(path)) {
					ar.push(path);
				}
			}
			FV.Navigate(Sync.EmptyFolder.PATH + ar.join(";"), SBSP_NEWBROWSER);
		}
		return S_OK;
	},

	Notify: function (pid, pid2) {
		const cTC = te.Ctrls(CTRL_TC);
		for (let i in cTC) {
			const TC = cTC[i];
			for (let j in TC) {
				const FV = TC[j];
				if (this.GetSearchString(FV)) {
					if (FV.RemoveItem(pid) == S_OK && pid2) {
						FV.AddItem(api.GetDisplayNameOf(pid2, SHGDN_FORPARSING));
					}
				}
			}
		}
	},

	rmdir: function (Ctrl, pt) {
		if (!confirmOk()) {
			return S_OK;
		}
		let Items = GetSelectedItems(Ctrl, pt);
		let FV = GetFolderView(Ctrl, pt);
		let oErr = {};
		let rd = wsh.ExpandEnvironmentStrings("%ComSpec% /crd ");
		for (let j in Items) {
			let Item = Items.Item(j);
			let path = Item.Path;
			let r = api.CreateProcess(rd + PathQuoteSpaces(path));
			if (r) {
				r = r.replace(/\s$/, "");
				oErr[r] = (oErr[r] || '') + path + "\n"
			} else {
				FV.RemoveItem(Item);
			}
		}
		let s = [];
		for (let i in oErr) {
			s.push(i);
			s.push(oErr[i]);
		}
		if (s.length) {
			MessageBox(s.join("\n"), TITLE, MB_ICONSTOP | MB_OK)
		}
		return S_OK;
	}
};

AddEvent("TranslatePath", function (Ctrl, Path) {
	if (api.PathMatchSpec(Path, Sync.EmptyFolder.PATH + "*")) {
		return ssfRESULTSFOLDER;
	}
}, true);

AddEvent("BeginNavigate", function (Ctrl) {
	const Path = Sync.EmptyFolder.GetSearchString(Ctrl);
	if (Path) {
		OpenNewProcess("addons\\emptyfolder\\worker.js", {
			FV: Ctrl,
			Path: Path,
			SessionId: Ctrl.SessionId,
			hwnd: te.hwnd,
			ProgressDialog: api.CreateObject("ProgressDialog"),
			Locale: g_.IEVer > 8 ? 999 : Infinity,
			NavigateComplete: te.OnNavigateComplete
		});
		return S_FALSE;
	}
});

AddEvent("GetIconImage", function (Ctrl, clBk, bSimple) {
	if (Sync.EmptyFolder.GetSearchString(Ctrl)) {
		return MakeImgDataEx(Sync.EmptyFolder.Icon || "folder:closed", bSimple, 16, clBk);
	}
});

AddEvent("GetFolderItemName", function (pid) {
	let res = new RegExp("^" + Sync.EmptyFolder.PATH + ".*?([^\\\\]+)$", "i").exec(pid.Path)
	if (res) {
		return Sync.EmptyFolder.PATH + res[1];
	}
}, true);

AddEvent("ChangeNotify", function (Ctrl, pidls) {
	if (pidls.lEvent & (SHCNE_DELETE | SHCNE_DRIVEREMOVED | SHCNE_MEDIAREMOVED | SHCNE_NETUNSHARE | SHCNE_RMDIR | SHCNE_SERVERDISCONNECT)) {
		Sync.EmptyFolder.Notify(pidls[0]);
	}
	if (pidls.lEvent & (SHCNE_RENAMEFOLDER | SHCNE_RENAMEITEM)) {
		Sync.EmptyFolder.Notify(pidls[0], pidls[1]);
	}
});

AddEvent("ILGetParent", function (FolderItem) {
	let Path = Sync.EmptyFolder.GetSearchString(FolderItem);
	if (Path) {
		return Path;
	}
});

AddEvent("Context", function (Ctrl, hMenu, nPos, Selected, item, ContextMenu) {
	if (Sync.EmptyFolder.GetSearchString(Ctrl)) {
		api.InsertMenu(hMenu, -1, MF_BYPOSITION | MF_STRING, ++nPos, api.LoadString(hShell32, 31368));
		ExtraMenuCommand[nPos] = OpenContains;
		api.InsertMenu(hMenu, -1, MF_BYPOSITION | MF_STRING, ++nPos, api.LoadString(hShell32, 33553) + " rmdir");
		ExtraMenuCommand[nPos] = Sync.EmptyFolder.rmdir;
	}
	return nPos;
});

AddEvent("InvokeCommand", function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon) {
	if (!Verb || Verb == CommandID_STORE - 1) {
		if (ContextMenu.Items.Count >= 1) {
			let path = Sync.EmptyFolder.GetSearchString(ContextMenu.Items.Item(0));
			if (path) {
				Navigate(Sync.EmptyFolder.PATH + path, SBSP_SAMEBROWSER);
				return S_OK;
			}
		}
	}
}, true);

//Menu
if (item.getAttribute("MenuExec")) {
	AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos) {
		api.InsertMenu(hMenu, Sync.EmptyFolder.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Sync.EmptyFolder.strName));
		ExtraMenuCommand[nPos] = Sync.EmptyFolder.Exec;
		return nPos;
	});
}
//Key
if (item.getAttribute("KeyExec")) {
	SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Sync.EmptyFolder.Exec, "Func");
}
//Mouse
if (item.getAttribute("MouseExec")) {
	SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Sync.EmptyFolder.Exec, "Func");
}
//Type
AddTypeEx("Add-ons", "Empty folder", Sync.EmptyFolder.Exec);
