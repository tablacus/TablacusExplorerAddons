var Addon_Id = "iconoverlay";

if (window.Addon == 1) {
	Addons.IconOverlay =
	{
		DLL: api.DllGetClassObject(fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), ["addons\\iconoverlay\\ticonoverlay", api.sizeof("HANDLE") * 8, ".dll"].join("")), "{ADB2CB70-5C00-4fa2-B121-CB60B556FFA7}"),
		Icon: {},
		db: {},

		Callback: function (path, IconFile, Index, dwFlags, Id) {
			var key = IconFile + (dwFlags == 1 ? "" : "," + Index);
			if (!Addons.IconOverlay.Icon[key]) {
				Addons.IconOverlay.Icon[key] = [];
			}
			Addons.IconOverlay.db[Id][path] = key;
			if (Id && Addons.IconOverlay.db[0] && Addons.IconOverlay.db[0][path] != Addons.IconOverlay.db[Id][path]) {
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

		Refresh: function (Ctrl) {
			Addons.IconOverlay.db[Ctrl.Id] = {};
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

		AddEvent("ItemPostPaint2", function (Ctrl, pid, nmcd, vcd) {
			if (pid && Addons.IconOverlay.DLL) {
				var hList = Ctrl.hwndList;
				var hTree = Ctrl.hwndTree;
				if (hList || hTree) {
					var Id = hList ? Ctrl.Id : 0;
					if (!Addons.IconOverlay.db[Id]) {
						Addons.IconOverlay.db[Id] = {};
					}
					var key = Addons.IconOverlay.db[Id][pid.Path];
					if (key === void 0) {
						Addons.IconOverlay.db[Id][pid.Path] = null;
						Addons.IconOverlay.DLL.GetOverlayIcon(pid.Path, api.GetAttributesOf(pid, SFGAO_STORAGECAPMASK), Id);
					}
					if (!key && Id && Addons.IconOverlay.db[0]) {
						key = Addons.IconOverlay.db[0][pid.Path]
					}
					var icon = Addons.IconOverlay.Icon[key];
					if (icon) {
						var rc = api.Memory("RECT");
						if (hList) {
							var i = Ctrl.IconSize < 32 ? 0 : 1;
							if (!icon[i]) {
								if (i) {
									if (/,/.test(key)) {
										icon[i] = MakeImgData("icon:" + key, 0, 32);
									} else {
										icon[i] = api.CreateObject("WICBitmap").FromFile(key);
									}
								} else {
									icon[i] = MakeImgData("icon:" + key, 0, 16);
								}
							}
							rc.left = LVIR_ICON;
							api.SendMessage(hList, LVM_GETITEMRECT, nmcd.dwItemSpec, rc);
							var w = Ctrl.IconSize * screen.logicalYDPI / 96;
							var image = GetThumbnail(icon[i], Ctrl.IconSize < 32 ? w : (w * 5 / 16) + 16);
							var x = api.SendMessage(hList, LVM_GETVIEW, 0, 0) == 2 ? rc.right - w : rc.left + (rc.right - rc.left - w) / 2;
							var y = rc.bottom - image.GetHeight() - 2;
							if (image) {
								image.DrawEx(nmcd.hdc, x, y, 0, 0, CLR_NONE, CLR_NONE, ILD_NORMAL);
							}
						} else {
							if (hTree) {
								rc.Write(0, VT_I8, nmcd.dwItemSpec);
								if (api.SendMessage(hTree, TVM_GETITEMRECT, true, rc)) {
									if (!icon[0]) {
										icon[0] = MakeImgData("icon:" + key, 0, 16);
									}
									if (icon[0]) {
										icon[0].DrawEx(nmcd.hdc, rc.left - 19 * screen.logicalXDPI / 96, rc.top + 2 * screen.logicalYDPI / 96, 0, 0, CLR_NONE, CLR_NONE, ILD_NORMAL);
									}
								}
							}
						}
					}
				}
			}
		});

		AddEvent("ListViewCreated", Addons.IconOverlay.Refresh);

		AddEvent("Command", function (Ctrl, hwnd, msg, wParam, lParam) {
			if (msg == WM_NULL) {
				Addons.IconOverlay.db= {};
			}
		});

		AddEvent("ChangeNotify", function (Ctrl, pidls, wParam, lParam) {
			var path = api.GetDisplayNameOf(pidls[0], SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL);
			for (var Id in Addons.IconOverlay.db) {
				delete Addons.IconOverlay.db[Id][path];
			}
		});
	}
} else {
	SetTabContents(0, "", '<label>Base</label><br><input type="text" id="Base" placeholder="11" style="width: 100%">');
}
