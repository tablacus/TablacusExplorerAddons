var Addon_Id = "emptyfolder";
var Default = "None";

var item = GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.EmptyFolder =
	{
		PATH: "emptyfolder:",
		iCaret: -1,
		strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
		nPos: api.LowPart(item.getAttribute("MenuPos")),

		GetSearchString: function(Ctrl)
		{
			if (Ctrl) {
				var res = new RegExp("^" + Addons.EmptyFolder.PATH + "\\s*(.*)" , "i").exec(api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL));
				if (res) {
					return res[1];
				}
			}
			return "";
		},

		Exec: function (Ctrl, pt)
		{
			var FV = GetFolderView(Ctrl, pt);
			if (FV) {
				FV.Focus();
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
				FV.Navigate(Addons.EmptyFolder.PATH + ar.join(";"), SBSP_NEWBROWSER);
			}
			return S_OK;
		},

		Notify: function (pid, pid2)
		{
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
		},

		rmdir: function (Ctrl, pt)
		{
			if (!confirmOk()) {
				return S_OK;
			}
			var Items = GetSelectedItems(Ctrl, pt);
			var FV = GetFolderView(Ctrl, pt);
			var oErr = {};
			var rd = wsh.ExpandEnvironmentStrings("%ComSpec% /crd ");
			for (var j in Items) {
				var Item = Items.Item(j);
				var path = Item.Path;
				var r = api.CreateProcess(rd + api.PathQuoteSpaces(path));
				if (r) {
					r = r.replace(/\s$/, "");
					oErr[r] = (oErr[r] || '') + path + "\n"
				} else {
					FV.RemoveItem(Item);
				}
			}
			var s = [];
			for (var i in oErr) {
				s.push(i);
				s.push(oErr[i]);
			}
			if (s.length) {
				MessageBox(s.join("\n"), TITLE, MB_ICONSTOP | MB_OK)
			}
			return S_OK;
		}
	};

	AddEvent("TranslatePath", function (Ctrl, Path)
	{
		if (api.PathMatchSpec(Path, Addons.EmptyFolder.PATH + "*")) {
			return ssfRESULTSFOLDER;
		}
	}, true);

	AddEvent("BeginNavigate", function (Ctrl)
	{
		var Path = Addons.EmptyFolder.GetSearchString(Ctrl);
		if (Path) {
			OpenNewProcess("addons\\emptyfolder\\worker.js",
			{
				FV: Ctrl,
				Path: Path,
				SessionId: Ctrl.SessionId,
				hwnd: te.hwnd,
				ProgressDialog: te.ProgressDialog,
				Locale: document.documentMode > 8 ? 999 : Infinity,
				NavigateComplete: te.OnNavigateComplete
			});
			return S_FALSE;
		}
	});

	AddEvent("GetIconImage", function (Ctrl, BGColor, bSimple)
	{
		if (Addons.EmptyFolder.GetSearchString(Ctrl)) {
			return MakeImgDataEx("icon:shell32.dll,3", bSimple, 16);
		}
	});

	AddEvent("GetFolderItemName", function (pid)
	{
		var res = new RegExp("^" + Addons.EmptyFolder.PATH + ".*?([^\\\\]+)$", "i").exec(pid.Path)
		if (res) {
			return Addons.EmptyFolder.PATH + res[1];
		}
	}, true);

	AddEvent("ChangeNotify", function (Ctrl, pidls)
	{
		if (pidls.lEvent & (SHCNE_DELETE | SHCNE_DRIVEREMOVED | SHCNE_MEDIAREMOVED | SHCNE_NETUNSHARE | SHCNE_RMDIR | SHCNE_SERVERDISCONNECT)) {
			Addons.EmptyFolder.Notify(pidls[0]);
		}
		if (pidls.lEvent & (SHCNE_RENAMEFOLDER | SHCNE_RENAMEITEM)) {
			Addons.EmptyFolder.Notify(pidls[0], pidls[1]);
		}
	});

	AddEvent("ILGetParent", function (FolderItem)
	{
		var Path = Addons.EmptyFolder.GetSearchString(FolderItem);
		if (Path) {
			return Path;
		}
	});

	AddEvent("Context", function (Ctrl, hMenu, nPos, Selected, item, ContextMenu)
	{
		if (Addons.EmptyFolder.GetSearchString(Ctrl)) {
			api.InsertMenu(hMenu, -1, MF_BYPOSITION | MF_STRING, ++nPos, api.LoadString(hShell32, 31368));
			ExtraMenuCommand[nPos] = OpenContains;
			api.InsertMenu(hMenu, -1, MF_BYPOSITION | MF_STRING, ++nPos, api.LoadString(hShell32, 33553) + " rmdir");
			ExtraMenuCommand[nPos] = Addons.EmptyFolder.rmdir;
		}
		return nPos;
	});

	AddEvent("InvokeCommand", function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon)
	{
		if (!Verb || Verb == CommandID_STORE - 1) {
			if (ContextMenu.Items.Count >= 1) {
				var path = Addons.EmptyFolder.GetSearchString(ContextMenu.Items.Item(0));
				if (path) {
					Navigate(Addons.EmptyFolder.PATH + path, SBSP_SAMEBROWSER);
					return S_OK;
				}
			}
		}
	}, true);

	if (item) {
		//Menu
		if (item.getAttribute("MenuExec")) {
			AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
			{
				api.InsertMenu(hMenu, Addons.EmptyFolder.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Addons.EmptyFolder.strName));
				ExtraMenuCommand[nPos] = Addons.EmptyFolder.Exec;
				return nPos;
			});
		}
		//Key
		if (item.getAttribute("KeyExec")) {
			SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.EmptyFolder.Exec, "Func");
		}
		//Mouse
		if (item.getAttribute("MouseExec")) {
			SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.EmptyFolder.Exec, "Func");
		}
		//Type
		AddTypeEx("Add-ons", "Empty folder", Addons.EmptyFolder.Exec);
	}
	var h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.EmptyFolder.Exec(this)" oncontextmenu="return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', GetImgTag({ title: Addons.EmptyFolder.strName, src: item.getAttribute("Icon") }, h), '</span>']);
} else {
	EnableInner();
}
