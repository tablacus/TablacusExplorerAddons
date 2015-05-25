Addon_Id = "emptyfolder";
Default = "None";

var items = te.Data.Addons.getElementsByTagName(Addon_Id);
var item = items.length ? items[0] : null;

if (window.Addon == 1) {
	Addons.EmptyFolder =
	{
		PATH: "emptyfolder:",
		iCaret: -1,
		strName: "",
		uid: {},

		GetSearchString: function(Ctrl)
		{
			if (Ctrl.FolderItem) {
				if (new RegExp("^" + Addons.EmptyFolder.PATH + "\\s*(.*)" , "i").test(Ctrl.FolderItem.Path)) {
					return RegExp.$1;
				}
			}
			return "";
		},

		Exec: function (Ctrl, pt)
		{
			var FV = GetFolderView(Ctrl, pt);
			if (FV) {
				var ar = [];
				var Selected = FV.SelectedItems();
				if (Selected && Selected.Count) {
					for (var i = Selected.Count; i--;) {
						var path = api.GetDisplayNameOf(Selected.Item(i), SHGDN_FORPARSING);
						if (/^[A-Z]:\\|^\\/i.test(path)) {
							ar.unshift(path);
						}
					}
				}
				else {
					var path = api.GetDisplayNameOf(FV, SHGDN_FORPARSING);
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
							FV.AddItem(api.GetDisplayNameOf(pid2, SHGDN_FORPARSING));
						}
					}
				}
			}
		}
	};

	AddEvent("TranslatePath", function (Ctrl, Path)
	{
		if (api.PathMatchSpec(Path, Addons.EmptyFolder.PATH + "*")) {
			return ssfRESULTSFOLDER;
		}
	}, true);

	AddEvent("NavigateComplete", function (Ctrl)
	{
		var Path = Addons.EmptyFolder.GetSearchString(Ctrl);
		if (Path) {
			var ex = Exchange[Addons.EmptyFolder.uid[Ctrl.Id]];
			if (ex) {
				ex.Do = false;
			}
			var uid;
			do {
				uid = String(Math.random()).replace(/^0?\./, "");
			} while (Exchange[uid]);
			Exchange[uid] = 
			{
				FV: Ctrl,
				Path: Path,
				Do: true
			};
			Addons.EmptyFolder.uid[Ctrl.Id] = uid;
			wsh.Exec([api.PathQuoteSpaces(api.GetModuleFileName(null)), '/run', "addons\\emptyfolder\\worker.js", uid].join(" "));
		}
	});

	AddEvent("GetTabName", function (Ctrl)
	{
		if (new RegExp("^" + Addons.EmptyFolder.PATH, "i").test(Ctrl.FolderItem.Path)) {
			return Addons.EmptyFolder.strName || "Empty folder";
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

	if (item) {
		Addons.EmptyFolder.strName = item.getAttribute("MenuName") || GetText(GetAddonInfo(Addon_Id).Name);
		//Menu
		if (item.getAttribute("MenuExec")) {
			Addons.EmptyFolder.nPos = api.LowPart(item.getAttribute("MenuPos"));
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
		AddTypeEx("Add-ons", "Attributes color", Addons.EmptyFolder.Exec);
	}
	var h = GetAddonOption(Addon_Id, "IconSize") || window.IconSize || 24;
	var s = GetAddonOption(Addon_Id, "Icon");
	if (s) {
		s = '<img title="' + Addons.EmptyFolder.strName.replace(/"/g, "") + '" src="' + s.replace(/"/g, "") + '" width="' + h + 'px" height="' + h + 'px" />';
	}
	else {
		s = Addons.EmptyFolder.strName;
	}
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.EmptyFolder.Exec();" oncontextmenu="Addons.EmptyFolder.Popup(); return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', s, '</span>']);
}
