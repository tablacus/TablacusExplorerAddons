var Addon_Id = "treeview";
var Default = "ToolBar2Left";

var item = GetAddonElement(Addon_Id);
if (item) {
	if (!item.getAttribute("Set")) {
		item.setAttribute("MenuPos", -1);
	}
}

if (window.Addon == 1) {
	Addons.TreeView =
	{
		strName: "Tree",
		nPos: 0,
		WM: TWM_APP++,
		Depth: item && api.LowPart(item.getAttribute("Depth")),
		tid: {},

		Exec: function (Ctrl, pt)
		{
			var FV = GetFolderView(Ctrl, pt);
			if (FV) {
				var TV = FV.TreeView;
				if (TV) {
					TV.Visible = !TV.Visible;
					if (TV.Width == 0 && TV.Visible) {
						TV.Width = 200;
					}
				}
			}
			return S_OK;
		},

		Popup: function ()
		{
			var TV = te.Ctrl(CTRL_TV);
			if (TV) {
				var n = InputDialog(GetText("Width"), TV.Width);
				if (n) {
					TV.Width = n;
					TV.Align = true;
				}
			}
		}
	};

	AddEvent("ChangeView", function (Ctrl)
	{
		if (Ctrl.FolderItem) {
			var TV = Ctrl.TreeView;
			if (TV) {
				if (Addons.TreeView.tid[TV.Id]) {
					clearTimeout(Addons.TreeView.tid[TV.Id]);
					delete Addons.TreeView.tid[TV.Id];
				}
				TV.Expand(Ctrl.FolderItem, Addons.TreeView.Depth);
				Addons.TreeView.tid[TV.Id] = setTimeout(function ()
				{
					delete Addons.TreeView.tid[TV.Id];
					TV.Expand(Ctrl.FolderItem, 0);
				}, 500);
			}
		}
	});

	if (item) {
		//Menu
		if (item.getAttribute("MenuExec")) {
			Addons.TreeView.nPos = api.LowPart(item.getAttribute("MenuPos"));
			Addons.TreeView.strName = item.getAttribute("MenuName") || Addons.TreeView.strName;
			AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
			{
				api.InsertMenu(hMenu, Addons.TreeView.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Addons.TreeView.strName));
				ExtraMenuCommand[nPos] = Addons.TreeView.Exec;
				return nPos;
			});
		}
		//Key
		if (item.getAttribute("KeyExec")) {
			SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.TreeView.Exec, "Func");
		}
		//Mouse
		if (item.getAttribute("MouseExec")) {
			SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.TreeView.Exec, "Func");
		}
	}
	var h = (item && item.getAttribute("IconSize")) || window.IconSize || 24;
	var src = (item && item.getAttribute("Icon")) || (h <= 16 ? "bitmap:ieframe.dll,216,16,43" : "bitmap:ieframe.dll,214,24,43");
	var s = ['<span class="button" onclick="Addons.TreeView.Exec(this)" oncontextmenu="Addons.TreeView.Popup(this); return false" onmouseover="MouseOver(this)" onmouseout="MouseOut()"><img title="Tree" src="', src.replace(/"/g, ""), '" width="', h, 'px" height="', h, 'px"></span>'];
	SetAddon(Addon_Id, Default, s);

	SetGestureExec("Tree", "1", function ()
	{
		var hItem = Ctrl.HitTest(pt, TVHT_ONITEM);
		if (hItem) {
			Ctrl.FolderView.Navigate(Ctrl.SelectedItem, OpenMode);
		}
		return S_OK;
	}, "Func", true);

	SetGestureExec("Tree", "3", function ()
	{
		var hItem = Ctrl.HitTest(pt, TVHT_ONITEM);
		if (hItem) {
			Ctrl.FolderView.Navigate(Ctrl.SelectedItem, SBSP_NEWBROWSER);
		}
		return S_OK;
	}, "Func", true);

	//Tab
	SetKeyExec("Tree", "$f", function (Ctrl, pt)
	{
		var FV = GetFolderView(Ctrl, pt);
		FV.focus();
		return S_OK;
	}, "Func", true);
	//Enter
	SetKeyExec("Tree", "$1c", function (Ctrl, pt)
	{
		var FV = GetFolderView(Ctrl, pt);
		FV.Navigate(Ctrl.SelectedItem, OpenMode);
		return S_OK;
	}, "Func", true);

	AddTypeEx("Add-ons", Addons.TreeView.strName, Addons.TreeView.Exec);

	if (WINVER >= 0x600) {
		AddEvent("AppMessage", function (Ctrl, hwnd, msg, wParam, lParam)
		{
			if (msg == Addons.TreeView.WM) {
				var pidls = {};
				var hLock = api.SHChangeNotification_Lock(wParam, lParam, pidls);
				if (hLock) {
					api.SHChangeNotification_Unlock(hLock);
					var cTV = te.Ctrls(CTRL_TV);
					for (var i in cTV) {
						var TV = cTV[i];
						if (pidls.lEvent & (SHCNE_MKDIR | SHCNE_MEDIAINSERTED | SHCNE_DRIVEADD | SHCNE_NETSHARE)) {
							TV.Notify(pidls.lEvent, pidls[0], pidls[1]);
						} else {
							api.SendMessage(api.GetParent(TV.hwndTree), WM_USER + 1, wParam, lParam);
						}
					}
				}
				return S_OK;
			}
		});

		AddEvent("Finalize", function ()
		{
			api.SHChangeNotifyDeregister(Addons.TreeView.uRegisterId);
		});

		Addons.TreeView.uRegisterId = api.SHChangeNotifyRegister(te.hwnd, SHCNRF_InterruptLevel | SHCNRF_NewDelivery, SHCNE_MKDIR | SHCNE_MEDIAINSERTED | SHCNE_DRIVEADD | SHCNE_NETSHARE | SHCNE_DRIVEREMOVED | SHCNE_MEDIAREMOVED | SHCNE_NETUNSHARE | SHCNE_RENAMEFOLDER | SHCNE_RMDIR | SHCNE_SERVERDISCONNECT | SHCNE_UPDATEDIR, Addons.TreeView.WM, ssfDESKTOP, true);
	}
} else {
	EnableInner();
	document.getElementById("tab0").value = "General";
	document.getElementById("panel0").innerHTML = '<input type="checkbox" id="Depth" value="1" /><label for="Depth">Expanded</label>';
}
