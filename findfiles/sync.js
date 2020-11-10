var Addon_Id = "findfiles";
var item = GetAddonElement(Addon_Id);

Sync.FindFiles = {
    PATH: "findfiles:",
    iCaret: -1,
    strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
    nPos: api.LowPart(item.getAttribute("MenuPos")),

    GetSearchString: function (Ctrl) {
        if (Ctrl) {
            var res = new RegExp("^" + Sync.FindFiles.PATH + "\\s*(.*)", "i").exec(api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL));
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
        opt.height = 220;
        ShowDialog("../addons/findfiles/dialog.html", opt);
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
            FV.Navigate(Sync.FindFiles.PATH + ar.join(";"), SBSP_NEWBROWSER);
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
    if (api.PathMatchSpec(Path, Sync.FindFiles.PATH + "*")) {
        return ssfRESULTSFOLDER;
    }
}, true);

AddEvent("BeginNavigate", function (Ctrl) {
    var Path = Sync.FindFiles.GetSearchString(Ctrl);
    if (Path) {
        OpenNewProcess("addons\\findfiles\\worker.js", {
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
    var ar = Sync.FindFiles.GetSearchString(FolderItem).split("|");
    if (ar[0]) {
        return ar[0];
    }
});

AddEvent("Context", function (Ctrl, hMenu, nPos, Selected, item, ContextMenu) {
    if (Sync.FindFiles.GetSearchString(Ctrl)) {
        api.InsertMenu(hMenu, -1, MF_BYPOSITION | MF_STRING, ++nPos, api.LoadString(hShell32, 31368));
        ExtraMenuCommand[nPos] = OpenContains;
    }
    return nPos;
});

AddEvent("GetIconImage", function (Ctrl, BGColor, bSimple) {
    if (Sync.FindFiles.GetSearchString(Ctrl)) {
        return MakeImgDataEx("bitmap:ieframe.dll,216,16,17", bSimple, 16);
    }
});

AddEvent("ChangeNotify", function (Ctrl, pidls) {
    if (pidls.lEvent & (SHCNE_DELETE | SHCNE_DRIVEREMOVED | SHCNE_MEDIAREMOVED | SHCNE_NETUNSHARE | SHCNE_RMDIR | SHCNE_SERVERDISCONNECT)) {
        Sync.FindFiles.Notify(pidls[0]);
    }
    if (pidls.lEvent & (SHCNE_RENAMEFOLDER | SHCNE_RENAMEITEM)) {
        Sync.FindFiles.Notify(pidls[0], pidls[1]);
    }
});

AddEvent("InvokeCommand", function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon) {
    if (!Verb || Verb == CommandID_STORE - 1) {
        if (ContextMenu.Items.Count >= 1) {
            var path = Sync.FindFiles.GetSearchString(ContextMenu.Items.Item(0));
            if (path) {
                Navigate(Sync.FindFiles.PATH + path, SBSP_SAMEBROWSER);
                return S_OK;
            }
        }
    }
}, true);

//Menu
if (item.getAttribute("MenuExec")) {
    AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos) {
        api.InsertMenu(hMenu, Sync.FindFiles.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Sync.FindFiles.strName));
        ExtraMenuCommand[nPos] = Sync.FindFiles.Exec;
        return nPos;
    });
}
//Key
if (item.getAttribute("KeyExec")) {
    SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Sync.FindFiles.Exec, "Func");
}
//Mouse
if (item.getAttribute("MouseExec")) {
    SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Sync.FindFiles.Exec, "Func");
}
//Type
AddTypeEx("Add-ons", "Find Files", Sync.FindFiles.Exec);
