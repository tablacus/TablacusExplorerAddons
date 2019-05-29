var Addon_Id = "flat";
var Default = "None";

var item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", -1);
	item.setAttribute("Menu", "Tabs");
	item.setAttribute("MenuPos", -1);
}

Addons.Flat =
{
	PATH: "flat:",
	iCaret: -1,
	strName: item.getAttribute("MenuName") || GetText("Flat"),
	nPos: api.LowPart(item.getAttribute("MenuPos")),

	GetSearchString: function(Ctrl)
	{
		if (Ctrl) {
			var res = new RegExp("^" + Addons.Flat.PATH + "\\s*(.*)" , "i").exec(api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL));
			if (res) {
				return res[1];
			}
		}
		return "";
	},

	Exec: function (Ctrl, pt)
	{
		var FV = GetFolderView(Ctrl, pt);
		if (api.ILGetCount(FV.FolderItem) > 1) {
			FV.Focus();
			var path = api.GetDisplayNameOf(FV, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL);
			var pidl = api.ILCreateFromPath(path);
			if (pidl && pidl.IsFolder) {
				FV.Navigate(Addons.Flat.PATH + path);
			};
		}
		return S_OK;
	},

	Enum: function (pid, Ctrl, fncb, SessionId)
	{
		var path = Addons.Flat.GetSearchString(Ctrl);
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

			var fn = fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), "addons\\flat\\worker.js");
			var ado = OpenAdodbFromTextFile(fn);
			if (ado) {
				api.ExecScript(ado.ReadText(), "JScript", v, true);
				ado.Close();
			}
		}
	},

	AddItem: function (pid)
	{
		var cFV = te.Ctrls(CTRL_FV);
		for (var i in cFV) {
			var FV = cFV[i];
			var path = Addons.Flat.GetSearchString(FV);
			if (path) {
				if (api.ILIsParent(path, pid, false)) {
					FV.AddItem(api.GetDisplayNameOf(pid, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_FORPARSINGEX));
				}
			}
		}
	},

	RemoveItem: function (pidl)
	{
		var cFV = te.Ctrls(CTRL_FV);
		for (var i in cFV) {
			var FV = cFV[i];
			var path = Addons.Flat.GetSearchString(FV);
			if (path) {
				if (api.ILIsParent(path, pidl, false)) {
					FV.RemoveItem(pidl);
				}
			}
		}
	}
};

if (window.Addon == 1) {
	AddEvent("TranslatePath", function (Ctrl, Path)
	{
		if (api.PathMatchSpec(Path, Addons.Flat.PATH + "*")) {
			Ctrl.Enum = Addons.Flat.Enum;
			return ssfRESULTSFOLDER;
		}
	}, true);

	AddEvent("ChangeNotify", function (Ctrl, pidls)
	{
		if (pidls.lEvent & (SHCNE_DELETE | SHCNE_DRIVEREMOVED | SHCNE_MEDIAREMOVED | SHCNE_NETUNSHARE | SHCNE_RENAMEITEM | SHCNE_RENAMEFOLDER | SHCNE_RMDIR | SHCNE_SERVERDISCONNECT)) {
			Addons.Flat.RemoveItem(pidls[0]);
		}
		if (pidls.lEvent & (SHCNE_RENAMEFOLDER | SHCNE_RENAMEITEM)) {
			Addons.Flat.AddItem(pidls[1]);
		}
		if (pidls.lEvent & (SHCNE_CREATE | SHCNE_DRIVEADD | SHCNE_MEDIAINSERTED | SHCNE_NETSHARE | SHCNE_MKDIR)) {
			Addons.Flat.AddItem(pidls[0]);
		}
	});

	AddEvent("ILGetParent", function (FolderItem)
	{
		var path = Addons.Flat.GetSearchString(FolderItem);
		if (path) {
			return path;
		}
	});

	AddEvent("Context", function (Ctrl, hMenu, nPos, Selected, item, ContextMenu)
	{
		if (Addons.Flat.GetSearchString(Ctrl)) {
			api.InsertMenu(hMenu, -1, MF_BYPOSITION | MF_STRING, ++nPos, api.LoadString(hShell32, 31368));
			ExtraMenuCommand[nPos] = OpenContains;
		}
		return nPos;
	});

	AddEvent("GetFolderItemName", function (pid)
	{
		var path = Addons.Flat.GetSearchString(pid);
		if (path) {
			return Addons.Flat.PATH + fso.GetFileName(path);
		}
	}, true);

	AddEvent("GetIconImage", function (Ctrl, BGColor, bSimple)
	{
		if (Addons.Flat.GetSearchString(Ctrl)) {
			return MakeImgDataEx("icon:shell32.dll,4,16", bSimple, 16);
		}
	});

	AddEvent("DragOver", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		if (Ctrl.Type <= CTRL_EB || Ctrl.Type == CTRL_DT) {
			if (Addons.Flat.GetSearchString(Ctrl)) {
				pdwEffect[0] = DROPEFFECT_NONE;
				return S_OK;
			}
		}
	});

	AddEvent("InvokeCommand", function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon)
	{
		if (!Verb || Verb == CommandID_STORE - 1) {
			if (ContextMenu.Items.Count >= 1) {
				var path = Addons.Flat.GetSearchString(ContextMenu.Items.Item(0));
				if (path) {
					Navigate(Addons.Flat.PATH + path, SBSP_SAMEBROWSER);
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
				api.InsertMenu(hMenu, Addons.Flat.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Addons.Flat.strName));
				ExtraMenuCommand[nPos] = Addons.Flat.Exec;
				return nPos;
			});
		}
		//Key
		if (item.getAttribute("KeyExec")) {
			SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.Flat.Exec, "Func");
		}
		//Mouse
		if (item.getAttribute("MouseExec")) {
			SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.Flat.Exec, "Func");
		}
		//Type
		AddTypeEx("Add-ons", "Flat", Addons.Flat.Exec);
	}
	var h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.Flat.Exec(this);" oncontextmenu="Addons.Flat.Exec(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', GetImgTag({ title: Addons.Flat.strName, src: GetAddonOption(Addon_Id, "Icon") }, h), '</span>']);
} else {
	EnableInner();
}
