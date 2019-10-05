var Addon_Id = "findfiles";
var Default = "None";

var item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("Menu", "File");
	item.setAttribute("MenuPos", -1);

	item.setAttribute("KeyExec", 1);
	item.setAttribute("KeyOn", "All");
	item.setAttribute("Key", "$3d");
}

Addons.FindFiles =
{
	PATH: "findfiles:",
	iCaret: -1,
	strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
	nPos: api.LowPart(item.getAttribute("MenuPos")),

	GetSearchString: function(Ctrl)
	{
		if (Ctrl) {
			var res = new RegExp("^" + Addons.FindFiles.PATH + "\\s*(.*)" , "i").exec(api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL));
			if (res) {
				return res[1];
			}
		}
		return "";
	},

	Exec: function (Ctrl, pt)
	{
		GetFolderView(Ctrl, pt).Focus();
		ShowDialog("../addons/findfiles/dialog.html", {MainWindow: window, width: 400, height: 220});
		return S_OK;
	},

	Start: function (Ctrl, pt)
	{
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
			FV.Navigate(Addons.FindFiles.PATH + ar.join(";"), SBSP_NEWBROWSER);
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
	}
};

if (window.Addon == 1) {
	AddEvent("TranslatePath", function (Ctrl, Path)
	{
		if (api.PathMatchSpec(Path, Addons.FindFiles.PATH + "*")) {
			return ssfRESULTSFOLDER;
		}
	}, true);

	AddEvent("BeginNavigate", function (Ctrl)
	{
		var Path = Addons.FindFiles.GetSearchString(Ctrl);
		if (Path) {
			OpenNewProcess("addons\\findfiles\\worker.js",
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

	AddEvent("ILGetParent", function (FolderItem)
	{
		var ar = Addons.FindFiles.GetSearchString(FolderItem).split("|");
		if (ar[0]) {
			return ar[0];
		}
	});

	AddEvent("Context", function (Ctrl, hMenu, nPos, Selected, item, ContextMenu)
	{
		if (Addons.FindFiles.GetSearchString(Ctrl)) {
			api.InsertMenu(hMenu, -1, MF_BYPOSITION | MF_STRING, ++nPos, api.LoadString(hShell32, 31368));
			ExtraMenuCommand[nPos] = OpenContains;
		}
		return nPos;
	});

	AddEvent("GetIconImage", function (Ctrl, BGColor, bSimple)
	{
		if (Addons.FindFiles.GetSearchString(Ctrl)) {
			return MakeImgDataEx("bitmap:ieframe.dll,216,16,17", bSimple, 16);
		}
	});

	AddEvent("ChangeNotify", function (Ctrl, pidls)
	{
		if (pidls.lEvent & (SHCNE_DELETE | SHCNE_DRIVEREMOVED | SHCNE_MEDIAREMOVED | SHCNE_NETUNSHARE | SHCNE_RMDIR | SHCNE_SERVERDISCONNECT)) {
			Addons.FindFiles.Notify(pidls[0]);
		}
		if (pidls.lEvent & (SHCNE_RENAMEFOLDER | SHCNE_RENAMEITEM)) {
			Addons.FindFiles.Notify(pidls[0], pidls[1]);
		}
	});

	AddEvent("InvokeCommand", function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon)
	{
		if (!Verb || Verb == CommandID_STORE - 1) {
			if (ContextMenu.Items.Count >= 1) {
				var path = Addons.FindFiles.GetSearchString(ContextMenu.Items.Item(0));
				if (path) {
					Navigate(Addons.FindFiles.PATH + path, SBSP_SAMEBROWSER);
					return S_OK;
				}
			}
		}
	}, true);

	//Menu
	if (item.getAttribute("MenuExec")) {
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
		{
			api.InsertMenu(hMenu, Addons.FindFiles.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Addons.FindFiles.strName));
			ExtraMenuCommand[nPos] = Addons.FindFiles.Exec;
			return nPos;
		});
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.FindFiles.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.FindFiles.Exec, "Func");
	}
	//Type
	AddTypeEx("Add-ons", "Find Files", Addons.FindFiles.Exec);

	var h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	var src = item.getAttribute("Icon") || (h <= 16 ? "bitmap:ieframe.dll,216,16,17" : "bitmap:ieframe.dll,214,24,17");
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.FindFiles.Exec(this);" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', GetImgTag({ title: Addons.FindFiles.strName, src: src }, h), '</span>']);
} else if (window.Addon == 2) {
	MainWindow.RunEvent1("BrowserCreated", document);

	AddEventEx(window, "load", function ()
	{
		FV = te.Ctrl(CTRL_FV);
		var ar = Addons.FindFiles.GetSearchString(FV).split("|");
		if (ar.length > 1) {
			document.F.location.value = ar.shift();
			document.F.name.value = ar.shift();
			document.F.content.value = ar.join("|").replace(/%2F/g, "/").replace(/%25/g, "%");
		} else {
			document.F.location.value = FV.FolderItem.Path;
			document.F.newtab.checked = true;
		}
		if (item) {
			document.title = item.getAttribute("MenuName") || GetText(GetAddonInfo(Addon_Id).Name);
		}
		ApplyLang(document);
		document.F.name.focus();

		document.body.onkeydown = function (e)
		{
			var key = (e || event).keyCode;
			if (key == VK_RETURN && document.F.location.value && (document.F.name.value || document.F.content.value)) {
				FindFiles();
			}
			if (key == VK_ESCAPE) {
				window.close();
			}
			return true;
		}
	});

	FindFiles = function ()
	{
		var ar = [];
		FV.Navigate("findfiles:" + [document.F.location.value, document.F.name.value, document.F.content.value.replace(/%/g, "%25").replace(/\//g, "%2F")].join("|"), document.F.newtab.checked ? SBSP_NEWBROWSER : SBSP_SAMEBROWSER);
		window.close();
	}
} else {
	EnableInner();
}
