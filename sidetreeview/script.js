var Addon_Id = "sidetreeview";

var item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("List", 1);
}
if (window.Addon == 1) {
	Addons.SideTreeView =
	{
		Align: api.LowPart(item.getAttribute("Align")) ? "Right" : "Left",
		Depth: api.LowPart(item.getAttribute("Depth")),
		Height: item.getAttribute("Height") || '100%',

		Init: function () {
			if (!te.Data["Conf_" + this.Align + "BarWidth"]) {
				te.Data["Conf_" + this.Align + "BarWidth"] = 178;
			}
			var h = Addons.SideTreeView.Height;
			if (h == Number(h)) {
				h += 'px';
			}
			SetAddon(Addon_Id, this.Align + "Bar2", ['<div id="sidetreeview" style="width: 100%; height: ', EncodeSC(h), '"></div>']);
			if (te.Ctrls(CTRL_FV).Count) {
				this.Create();
			}
		},

		Create: function () {
			this.TV = te.CreateCtrl(CTRL_TV);
			this.TV.Style = te.Data.Tree_Style;
			this.TV.SetRoot(te.Data.Tree_Root, te.Data.Tree_EnumFlags, te.Data.Tree_RootStyle);
			this.TV.Visible = true;

			if (item.getAttribute("List")) {
				AddEvent("ChangeView", Addons.SideTreeView.Expand);
				this.tid2 = -1;
			}

			AddEvent("Resize", function () {
				var o = document.getElementById("sidetreeview");
				var pt = GetPos(o);
				api.MoveWindow(Addons.SideTreeView.TV.hwnd, pt.x, pt.y, o.offsetWidth, o.offsetHeight, true);
				api.RedrawWindow(Addons.SideTreeView.TV.hwnd, null, 0, RDW_INVALIDATE | RDW_ERASE | RDW_FRAME | RDW_ALLCHILDREN);
				if (Addons.SideTreeView.tid2) {
					if (Addons.SideTreeView.tid2 != -1) {
						clearTimeout(Addons.SideTreeView.tid2);
					}
					Addons.SideTreeView.tid2 = setTimeout(function () {
						delete Addons.SideTreeView.tid2;
						Addons.SideTreeView.Expand(te.Ctrl(CTRL_FV));
					}, 999);
				}
			});

			AddEventEx(document, "MSFullscreenChange", function () {
				Addons.SideTreeView.TV.Visible = !document.msFullscreenElement;
			});

			AddEvent("Finalize", function () {
				Addons.SideTreeView.TV.Close();
			});
		},

		Expand: function (Ctrl) {
			if (Ctrl.FolderItem && !IsSearchPath(Ctrl.FolderItem)) {
				var TV = Addons.SideTreeView.TV;
				if (TV && Addons.SideTreeView.TV.Visible) {
					if (Addons.SideTreeView.tid) {
						clearTimeout(Addons.SideTreeView.tid);
						delete Addons.SideTreeView.tid;
					}
					TV.Expand(Ctrl.FolderItem, Addons.SideTreeView.Depth);
					Addons.SideTreeView.tid = setTimeout(function () {
						delete Addons.SideTreeView.tid;
						TV.Expand(Ctrl.FolderItem, 0);
					}, 99);
				}
			}
		}
	};

	AddEvent("Create", function (Ctrl) {
		if (Ctrl.Type == CTRL_TE) {
			Addons.SideTreeView.Create();
		}
	});
	Addons.SideTreeView.Init();

	AddEvent("Load", function () {
		if (Addons.TreeView) {
			return;
		}
		SetGestureExec("Tree", "1", function (Ctrl, pt) {
			var Item = Ctrl.SelectedItem;
			if (Item) {
				var FV = Ctrl.FolderView;
				if (!api.ILIsEqual(FV.FolderItem, Item)) {
					setTimeout(function () {
						FV.Navigate(Item, GetNavigateFlags(FV));
					}, 99);
				}
			}
			return S_OK;
		}, "Func", true);

		SetGestureExec("Tree", "3", function (Ctrl, pt) {
			var Item = Ctrl.SelectedItem;
			if (Item) {
				setTimeout(function () {
					Ctrl.FolderView.Navigate(Item, SBSP_NEWBROWSER);
				}, 99);
			}
			return S_OK;
		}, "Func", true);

		//Tab
		SetKeyExec("Tree", "$f", function (Ctrl, pt) {
			var FV = GetFolderView(Ctrl, pt);
			FV.focus();
			return S_OK;
		}, "Func", true);
		//Enter
		SetKeyExec("Tree", "$1c", function (Ctrl, pt) {
			var FV = GetFolderView(Ctrl, pt);
			FV.Navigate(Ctrl.SelectedItem, GetNavigateFlags(FV));
			return S_OK;
		}, "Func", true);

		if (WINVER >= 0x600) {
			AddEvent("AppMessage", function (Ctrl, hwnd, msg, wParam, lParam) {
				if (msg == Addons.SideTreeView.WM) {
					var pidls = {};
					var hLock = api.SHChangeNotification_Lock(wParam, lParam, pidls);
					if (hLock) {
						api.SHChangeNotification_Unlock(hLock);
						Addons.SideTreeView.TV.Notify(pidls.lEvent, pidls[0], pidls[1], wParam, lParam);
					}
					return S_OK;
				}
			});

			AddEvent("Finalize", function () {
				api.SHChangeNotifyDeregister(Addons.SideTreeView.uRegisterId);
			});

			Addons.SideTreeView.WM = TWM_APP++;
			Addons.SideTreeView.uRegisterId = api.SHChangeNotifyRegister(te.hwnd, SHCNRF_InterruptLevel | SHCNRF_NewDelivery, SHCNE_MKDIR | SHCNE_MEDIAINSERTED | SHCNE_DRIVEADD | SHCNE_NETSHARE | SHCNE_DRIVEREMOVED | SHCNE_MEDIAREMOVED | SHCNE_NETUNSHARE | SHCNE_RENAMEFOLDER | SHCNE_RMDIR | SHCNE_SERVERDISCONNECT | SHCNE_UPDATEDIR, Addons.SideTreeView.WM, ssfDESKTOP, true);
		}
	});
} else {
	var ado = OpenAdodbFromTextFile("addons\\" + Addon_Id + "\\options.html");
	if (ado) {
		SetTabContents(0, "", ado.ReadText(adReadAll));
		ado.Close();
	}
}
