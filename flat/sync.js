var Addon_Id = "flat";
var item = await GetAddonElement(Addon_Id);

Sync.Flat = {
	PATH: "flat:",
	iCaret: -1,
	strName: item.getAttribute("MenuName") || GetText("Flat"),
	nPos: GetNum(item.getAttribute("MenuPos")),
	Icon: item.getAttribute("Icon"),

	GetSearchString: function (Ctrl) {
		if (Ctrl) {
			var res = new RegExp("^" + Sync.Flat.PATH + "\\s*(.*)", "i").exec(api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL));
			if (res) {
				return res[1];
			}
		}
		return "";
	},

	Exec: function (Ctrl, pt) {
		var FV = GetFolderView(Ctrl, pt);
		if (api.ILGetCount(FV.FolderItem) > 1) {
			FV.Focus();
			var path = api.GetDisplayNameOf(FV, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL);
			var pidl = api.ILCreateFromPath(path);
			if (pidl && pidl.IsFolder) {
				FV.Navigate(Sync.Flat.PATH + path);
			};
		}
		return S_OK;
	},

	Enum: function (pid, Ctrl, fncb, SessionId) {
		var path = Sync.Flat.GetSearchString(Ctrl);
		if (path) {
			var v = {
				ex: {
					FV: Ctrl,
					Path: path,
					hwnd: te.hwnd,
					SessionId: SessionId,
					hShell32: hShell32,
					List: api.CreateObject("FolderItems"),
					fncb: fncb
				}, api: api
			}

			var ado = OpenAdodbFromTextFile("addons\\flat\\worker.js");
			if (ado) {
				api.ExecScript(ado.ReadText(), "JScript", v, true);
				ado.Close();
			}
		}
	},

	AddItem: function (pid) {
		var cFV = te.Ctrls(CTRL_FV);
		for (var i in cFV) {
			var FV = cFV[i];
			var path = Sync.Flat.GetSearchString(FV);
			if (path) {
				if (api.ILIsParent(path, pid, false)) {
					FV.AddItem(api.GetDisplayNameOf(pid, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_FORPARSINGEX));
				}
			}
		}
	},

	RemoveItem: function (pidl) {
		var cFV = te.Ctrls(CTRL_FV);
		for (var i in cFV) {
			var FV = cFV[i];
			var path = Sync.Flat.GetSearchString(FV);
			if (path) {
				if (api.ILIsParent(path, pidl, false)) {
					FV.RemoveItem(pidl);
				}
			}
		}
	}
};

AddEvent("TranslatePath", function (Ctrl, Path) {
	if (api.PathMatchSpec(Path, Sync.Flat.PATH + "*")) {
		Ctrl.Enum = Sync.Flat.Enum;
		return ssfRESULTSFOLDER;
	}
}, true);

AddEvent("ChangeNotify", function (Ctrl, pidls) {
	if (pidls.lEvent & (SHCNE_DELETE | SHCNE_DRIVEREMOVED | SHCNE_MEDIAREMOVED | SHCNE_NETUNSHARE | SHCNE_RENAMEITEM | SHCNE_RENAMEFOLDER | SHCNE_RMDIR | SHCNE_SERVERDISCONNECT)) {
		Sync.Flat.RemoveItem(pidls[0]);
	}
	if (pidls.lEvent & (SHCNE_RENAMEFOLDER | SHCNE_RENAMEITEM)) {
		Sync.Flat.AddItem(pidls[1]);
	}
	if (pidls.lEvent & (SHCNE_CREATE | SHCNE_DRIVEADD | SHCNE_MEDIAINSERTED | SHCNE_NETSHARE | SHCNE_MKDIR)) {
		Sync.Flat.AddItem(pidls[0]);
	}
});

AddEvent("ILGetParent", function (FolderItem) {
	var path = Sync.Flat.GetSearchString(FolderItem);
	if (path) {
		return path;
	}
});

AddEvent("Context", function (Ctrl, hMenu, nPos, Selected, item, ContextMenu) {
	if (Sync.Flat.GetSearchString(Ctrl)) {
		api.InsertMenu(hMenu, -1, MF_BYPOSITION | MF_STRING, ++nPos, api.LoadString(hShell32, 31368));
		ExtraMenuCommand[nPos] = OpenContains;
	}
	return nPos;
});

AddEvent("GetFolderItemName", function (pid) {
	var path = Sync.Flat.GetSearchString(pid);
	if (path) {
		return Sync.Flat.PATH + fso.GetFileName(path);
	}
}, true);

AddEvent("GetIconImage", function (Ctrl, BGColor, bSimple) {
	if (Sync.Flat.GetSearchString(Ctrl)) {
		return MakeImgDataEx(Sync.Flat.Icon || "folder:closed", bSimple, 16);
	}
});

AddEvent("DragOver", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
	if (Ctrl.Type <= CTRL_EB || Ctrl.Type == CTRL_DT) {
		if (Sync.Flat.GetSearchString(Ctrl)) {
			pdwEffect[0] = DROPEFFECT_NONE;
			return S_OK;
		}
	}
});

AddEvent("InvokeCommand", function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon) {
	if (!Verb || Verb == CommandID_STORE - 1) {
		if (ContextMenu.Items.Count >= 1) {
			var path = Sync.Flat.GetSearchString(ContextMenu.Items.Item(0));
			if (path) {
				Navigate(Sync.Flat.PATH + path, SBSP_SAMEBROWSER);
				return S_OK;
			}
		}
	}
}, true);

if (item) {
	//Menu
	if (item.getAttribute("MenuExec")) {
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos) {
			api.InsertMenu(hMenu, Sync.Flat.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Sync.Flat.strName));
			ExtraMenuCommand[nPos] = Sync.Flat.Exec;
			return nPos;
		});
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Sync.Flat.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Sync.Flat.Exec, "Func");
	}
	//Type
	AddTypeEx("Add-ons", "Flat", Sync.Flat.Exec);
}
