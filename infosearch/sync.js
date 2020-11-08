var Addon_Id = "infosearch";

var item = GetAddonElement(Addon_Id);

Sync.InfoSearch = {
	PATH: "infosearch:",
	iCaret: -1,
	strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
	nPos: api.LowPart(item.getAttribute("MenuPos")),

	GetSearchString: function (Ctrl) {
		if (Ctrl) {
			var res = new RegExp("^" + Sync.InfoSearch.PATH + "\\s*(.*)", "i").exec(api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL));
			if (res) {
				return res[1];
			}
		}
		return "";
	},

	Exec: function (Ctrl, pt) {
		GetFolderView(Ctrl, pt).Focus();
		var opt = api.CreateObject("Object");
		opt.MainWindow = window;
		opt.width = 400;
		opt.height = 240;
		ShowDialog("../addons/infosearch/dialog.html", opt);
		return S_OK;
	},

	Start: function (Ctrl, pt) {
		var FV = GetFolderView(Ctrl, pt);
		if (FV) {
			var ar = [];
			var Selected = FV.SelectedItems();
			if (Selected && Selected.Count) {
				for (var i = Selected.Count; i--;) {
					var path = api.GetDisplayNameOf(Selected.Item(i), SHGDN_FORPARSING | SHGDN_ORIGINAL);
					if (/^[A-Z]:\\|^\\/i.test(path)) {
						ar.unshift(path);
					}
				}
			} else {
				var path = api.GetDisplayNameOf(FV, SHGDN_FORPARSING | SHGDN_ORIGINAL);
				if (/^[A-Z]:\\|^\\/i.test(path)) {
					ar.push(path);
				}
			}
			FV.Navigate(Sync.InfoSearch.PATH + ar.join(";"), SBSP_NEWBROWSER);
		}
		return S_OK;
	},

	Notify: function (pid, pid2) {
		var cTC = te.Ctrls(CTRL_TC);
		for (var i in cTC) {
			var TC = cTC[i];
			for (var j in TC) {
				var FV = TC[j];
				if (this.GetSearchString(FV)) {
					if (FV.RemoveItem(pid) == S_OK && pid2) {
						FV.AddItem(api.GetDisplayNameOf(pid2, SHGDN_FORPARSING | SHGDN_ORIGINAL));
					}
				}
			}
		}
	}
};

AddEvent("TranslatePath", function (Ctrl, Path) {
	if (api.PathMatchSpec(Path, Sync.InfoSearch.PATH + "*")) {
		return ssfRESULTSFOLDER;
	}
}, true);

AddEvent("BeginNavigate", function (Ctrl) {
	var Path = Sync.InfoSearch.GetSearchString(Ctrl);
	if (Path) {
		OpenNewProcess("addons\\infosearch\\worker.js", {
			FV: Ctrl,
			Path: Path,
			SessionId: Ctrl.SessionId,
			hwnd: te.hwnd,
			ProgressDialog: te.ProgressDialog,
			Locale: g_.IEVer > 8 ? 999 : Infinity,
		});
		te.OnNavigateComplete(Ctrl);
		return S_FALSE;
	}
});

AddEvent("ILGetParent", function (FolderItem) {
	var ar = Sync.InfoSearch.GetSearchString(FolderItem).split("|");
	if (ar[0]) {
		return ar[0];
	}
});

AddEvent("Context", function (Ctrl, hMenu, nPos, Selected, item, ContextMenu) {
	if (Sync.InfoSearch.GetSearchString(Ctrl)) {
		api.InsertMenu(hMenu, -1, MF_BYPOSITION | MF_STRING, ++nPos, api.LoadString(hShell32, 31368));
		ExtraMenuCommand[nPos] = OpenContains;
	}
	return nPos;
});

AddEvent("GetIconImage", function (Ctrl, BGColor, bSimple) {
	if (Sync.InfoSearch.GetSearchString(Ctrl)) {
		return MakeImgDataEx("bitmap:ieframe.dll,216,16,17", bSimple, 16);
	}
});

AddEvent("ChangeNotify", function (Ctrl, pidls) {
	if (pidls.lEvent & (SHCNE_DELETE | SHCNE_DRIVEREMOVED | SHCNE_MEDIAREMOVED | SHCNE_NETUNSHARE | SHCNE_RMDIR | SHCNE_SERVERDISCONNECT)) {
		Sync.InfoSearch.Notify(pidls[0]);
	}
	if (pidls.lEvent & (SHCNE_RENAMEFOLDER | SHCNE_RENAMEITEM)) {
		Sync.InfoSearch.Notify(pidls[0], pidls[1]);
	}
});

AddEvent("InvokeCommand", function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon) {
	if (!Verb || Verb == CommandID_STORE - 1) {
		if (ContextMenu.Items.Count >= 1) {
			var path = Sync.InfoSearch.GetSearchString(ContextMenu.Items.Item(0));
			if (path) {
				Navigate(Sync.InfoSearch.PATH + path, SBSP_SAMEBROWSER);
				return S_OK;
			}
		}
	}
}, true);

//Menu
if (item.getAttribute("MenuExec")) {
	AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos) {
		api.InsertMenu(hMenu, Sync.InfoSearch.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Sync.InfoSearch.strName));
		ExtraMenuCommand[nPos] = Sync.InfoSearch.Exec;
		return nPos;
	});
}
//Key
if (item.getAttribute("KeyExec")) {
	SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Sync.InfoSearch.Exec, "Func");
}
//Mouse
if (item.getAttribute("MouseExec")) {
	SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Sync.InfoSearch.Exec, "Func");
}
//Type
AddTypeEx("Add-ons", "Information search", Sync.InfoSearch.Exec);
