Addon_Id = "findfiles";
Default = "None";

var items = te.Data.Addons.getElementsByTagName(Addon_Id);
var item = null;
if (items.length) {
	item = items[0];
	if (!item.getAttribute("Set")) {
		item.setAttribute("Menu", "File");
		item.setAttribute("MenuPos", -1);

		item.setAttribute("KeyExec", 1);
		item.setAttribute("KeyOn", "All");
		item.setAttribute("Key", "$3d");
	}
}

Addons.FindFiles =
{
	PATH: "findfiles:",
	iCaret: -1,
	strName: "",
	uid: {},

	GetSearchString: function(Ctrl)
	{
		if (Ctrl) {
			if (new RegExp("^" + Addons.FindFiles.PATH + "\\s*(.*)" , "i").test(api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING))) {
				return RegExp.$1;
			}
		}
		return "";
	},

	Exec: function (Ctrl, pt)
	{
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
					var path = api.GetDisplayNameOf(Selected.Item(i), SHGDN_FORPARSING);
					if (/^[A-Z]:\\|^\\/i.test(path)) {
						ar.unshift(path);
					}
				}
			} else {
				var path = api.GetDisplayNameOf(FV, SHGDN_FORPARSING);
				if (/^[A-Z]:\\|^\\/i.test(path)) {
					ar.push(path);
				}
			}
			FV.Navigate(Addons.FindFiles.PATH + ar.join(";"), SBSP_NEWBROWSER);
		}
		return S_OK;
	}

};

if (window.Addon == 1) {
	AddEvent("TranslatePath", function (Ctrl, Path)
	{
		if (api.PathMatchSpec(Path, Addons.FindFiles.PATH + "*")) {
			return ssfRESULTSFOLDER;
		}
	}, true);

	AddEvent("NavigateComplete", function (Ctrl)
	{
		var Path = Addons.FindFiles.GetSearchString(Ctrl);
		if (Path) {
			var ex = Exchange[Addons.FindFiles.uid[Ctrl.Id]];
			if (ex) {
				ex.Do = false;
			}
			OpenNewProcess("addons\\findfiles\\worker.js",
			{
				FV: Ctrl,
				Path: Path,
				SessionId: Ctrl.SessionId,
				ShowStatusText: function (Ctrl, Text, iPart, dwSessionId)
				{
					ShowStatusText(Ctrl, GetText(Text), iPart);
					return Ctrl.SessionId == dwSessionId;
				}
			});
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

	AddEvent("GetIconImage", function (Ctrl, BGColor)
	{
		if (Addons.FindFiles.GetSearchString(Ctrl)) {
			return MakeImgSrc("bitmap:ieframe.dll,216,16,14", 0, false, 16);
		}
	});

	if (item) {
		Addons.FindFiles.strName = item.getAttribute("MenuName") || GetText(GetAddonInfo(Addon_Id).Name);
		//Menu
		if (item.getAttribute("MenuExec")) {
			Addons.FindFiles.nPos = api.LowPart(item.getAttribute("MenuPos"));
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
		AddTypeEx("Add-ons", "Attributes color", Addons.FindFiles.Exec);
	}
	var h = GetAddonOption(Addon_Id, "IconSize") || window.IconSize || 24;
	var s = GetAddonOption(Addon_Id, "Icon");
	if (s) {
		s = '<img title="' + Addons.FindFiles.strName.replace(/"/g, "") + '" src="' + s.replace(/"/g, "") + '" width="' + h + 'px" height="' + h + 'px" />';
	} else {
		s = Addons.FindFiles.strName;
	}
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.FindFiles.Exec();" oncontextmenu="Addons.FindFiles.Popup(); return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', s, '</span>']);
}
else if (window.Addon == 2) {
	AddEventEx(window, "load", function ()
	{
		FV = te.Ctrl(CTRL_FV);
		var ar = Addons.FindFiles.GetSearchString(FV).split("|");
		if (ar.length > 1) {
			document.F.location.value = ar.shift();
			document.F.name.value = ar.shift();
			document.F.content.value = ar.join("|");
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
		FV.Navigate("findfiles:" + [document.F.location.value, document.F.name.value, document.F.content.value].join("|"), document.F.newtab.checked ? SBSP_NEWBROWSER : SBSP_SAMEBROWSER);
		window.close();
	}
}
