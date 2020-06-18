var Addon_Id = "iconoverlay";

if (window.Addon == 1) {
	Addons.IconOverlay =
	{
		DLL: api.DllGetClassObject(fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), ["addons\\iconoverlay\\ticonoverlay", api.sizeof("HANDLE") * 8, ".dll"].join("")), "{ADB2CB70-5C00-4fa2-B121-CB60B556FFA7}"),
		Icon: [],
		db: {},

		Callback: function (path, key, Id) {
			Addons.IconOverlay.db[Id][path] = key;
			if (Id && Addons.IconOverlay.db[0] !== void 0 && Addons.IconOverlay.db[0][path] !== Addons.IconOverlay.db[Id][path]) {
				Addons.IconOverlay.db[0][path] = key;
			}
			if (Addons.IconOverlay.tid) {
				clearTimeout(Addons.IconOverlay.tid);
			}
			Addons.IconOverlay.tid = setTimeout(function () {
				delete Addons.IconOverlay.tid;
				api.RedrawWindow(te.hwnd, null, 0, RDW_INVALIDATE | RDW_FRAME | RDW_ALLCHILDREN);
			}, 500);
		},

		Finalize: function () {
			if (Addons.IconOverlay.DLL) {
				Addons.IconOverlay.DLL.Finalize();
				delete Addons.IconOverlay.DLL;
			}
		}
	};

	AddEvent("AddonDisabled", function (Id) {
		if (Id.toLowerCase() == "iconoverlay") {
			Addons.IconOverlay.Finalize();
		}
	});

	if (Addons.IconOverlay.DLL) {
		Addons.IconOverlay.DLL.init(GetAddonOption(Addon_Id, "Base") || 11, Addons.IconOverlay.Callback);
		var o = {};
		for (var i = 0; ; i++) {
			var hr = Addons.IconOverlay.DLL.GetOverlayInfo(i, o);
			if (hr < 0) {
				break;
			} else if (hr == S_OK) {
				Addons.IconOverlay.Icon[i] = [MakeImgData("icon:" + o.IconFile + (o.dwFlags == 1 ? "" : "," + o.Index), 0, 16), o.dwFlags == 1 ? api.CreateObject("WICBitmap").FromFile(o.IconFile) : MakeImgData("icon:" + o.IconFile + "," + o.Index, 0, 32)];
			}
		}
		if (Addons.IconOverlay.Icon.length) {
			AddEvent("ItemPostPaint2", function (Ctrl, pid, nmcd, vcd) {
				if (!pid) {
					return;
				}
				var hwnd = Ctrl.hwndList;
				var Id = hwnd ? Ctrl.Id : 0;
				if (!hwnd) {
					hwnd = Ctrl.hwndTree;
				}
				if (!hwnd) {
					return;
				}
				if (!Addons.IconOverlay.db[Id]) {
					Addons.IconOverlay.db[Id] = {};
				}
				var key = Addons.IconOverlay.db[Id][pid.Path];
				if (key === void 0) {
					Addons.IconOverlay.db[Id][pid.Path] = null;
					Addons.IconOverlay.DLL.GetOverlayIconIndex(pid.Path, api.GetAttributesOf(pid, SFGAO_STORAGECAPMASK), Id);
				}
				var icon = Addons.IconOverlay.Icon[key];
				if (!icon) {
					return;
				}
				var image, x, y;
				var rc = api.Memory("RECT");
				if (Id) {
					image = icon[Ctrl.IconSize < 32 ? 0 : 1];
					rc.Left = LVIR_ICON;
					api.SendMessage(hwnd, LVM_GETITEMRECT, nmcd.dwItemSpec, rc);
					var w = Ctrl.IconSize * screen.logicalYDPI / 96;
					image = GetThumbnail(image, Ctrl.IconSize < 32 ? w : (w * 5 / 16) + 16);
					x = api.SendMessage(hwnd, LVM_GETVIEW, 0, 0) == 2 ? rc.Right - w : rc.Left + (rc.Right - rc.Left - w) / 2;
					y = rc.Bottom - image.GetHeight() - 2;
				} else {
					image = icon[0];
					rc.Write(0, VT_I8, nmcd.dwItemSpec);
					api.SendMessage(hwnd, TVM_GETITEMRECT, true, rc);
					x = rc.Left - 19 * screen.logicalXDPI / 96;
					y = rc.Top + 2 * screen.logicalYDPI / 96;
				}
				if (image) {
					image.DrawEx(nmcd.hdc, x, y, 0, 0, CLR_NONE, CLR_NONE, ILD_NORMAL);
				}
			});

			AddEvent("ListViewCreated", function (Ctrl) {
				Addons.IconOverlay.db[Ctrl.Id] = {};
				if (Addons.IconOverlay.db[0] && Addons.IconOverlay.db[0][Ctrl.FolderItem.Path] !== void 0) {
					Addons.IconOverlay.DLL.GetOverlayIconIndex(Ctrl.FolderItem.Path, api.GetAttributesOf(Ctrl.FolderItem, SFGAO_STORAGECAPMASK), 0);
				}
			});

			AddEvent("Command", function (Ctrl, hwnd, msg, wParam, lParam) {
				if (msg == WM_NULL) {
					Addons.IconOverlay.db = {};
				}
			});

			AddEvent("ChangeNotify", function (Ctrl, pidls, wParam, lParam) {
				var path = pidls[0].Path;
				for (var Id in Addons.IconOverlay.db) {
					if (Addons.IconOverlay.db[Id][path] !== void 0) {
						Addons.IconOverlay.DLL.GetOverlayIconIndex(path, api.GetAttributesOf(pidls[0], SFGAO_STORAGECAPMASK), Id);
					}
				}
			});
		}
	}
} else {
	SetTabContents(0, "General", '<label>Base</label><br><input type="text" id="Base" placeholder="11" style="width: 100%">');
}
