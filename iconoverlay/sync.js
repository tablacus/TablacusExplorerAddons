const Addon_Id = "iconoverlay";
Sync.IconOverlay = {
	DLL: api.DllGetClassObject(BuildPath(te.Data.Installed, ["addons\\iconoverlay\\ticonoverlay", api.sizeof("HANDLE") * 8, ".dll"].join("")), "{ADB2CB70-5C00-4fa2-B121-CB60B556FFA7}"),
	Icon: [],
	db: {},

	Callback: function (path, key, Id) {
		const db = Sync.IconOverlay.db[Id];
		if (!db) {
			return;
		}
		const db0 = Sync.IconOverlay.db[0];
		db[path] = key;
		if (Id && db0 != null && db0[path] !== key) {
			db0[path] = key;
		}
		InvokeUI("Addons.IconOverlay.Redraw");
	},

	Finalize: function () {
		if (Sync.IconOverlay.DLL) {
			Sync.IconOverlay.DLL.Finalize();
			delete Sync.IconOverlay.DLL;
		}
	}
};

AddEvent("AddonDisabled", function (Id) {
	if (SameText(Id, "iconoverlay")) {
		Sync.IconOverlay.Finalize();
	}
});

if (Sync.IconOverlay.DLL) {
	Sync.IconOverlay.DLL.Init(GetAddonOption(Addon_Id, "Base") || 11, Sync.IconOverlay.Callback);
	const o = {};
	for (let i = 0; ; i++) {
		const hr = Sync.IconOverlay.DLL.GetOverlayInfo(i, o);
		if (hr < 0) {
			break;
		} else if (hr == S_OK) {
			Sync.IconOverlay.Icon[i] = [MakeImgData("icon:" + o.IconFile + (o.dwFlags == 1 ? "" : "," + o.Index), 0, 16), o.dwFlags == 1 ? api.CreateObject("WICBitmap").FromFile(o.IconFile) : MakeImgData("icon:" + o.IconFile + "," + o.Index, 0, 32)];
		}
	}
	if (Sync.IconOverlay.Icon.length) {
		AddEvent("ItemPostPaint2", function (Ctrl, pid, nmcd, vcd) {
			if (!pid || !Sync.IconOverlay.DLL) {
				return;
			}
			let hwnd = Ctrl.hwndList;
			const Id = hwnd ? Ctrl.Id : 0;
			if (!hwnd) {
				hwnd = Ctrl.hwndTree;
			}
			if (!hwnd) {
				return;
			}
			if (!Sync.IconOverlay.db[Id]) {
				Sync.IconOverlay.db[Id] = {};
			}
			const key = Sync.IconOverlay.db[Id][pid.Path];
			if (key == null) {
				Sync.IconOverlay.db[Id][pid.Path] = null;
				Sync.IconOverlay.DLL.GetOverlayIconIndex(pid.Path, api.GetAttributesOf(pid, SFGAO_STORAGECAPMASK), Id);
			}
			const icon = Sync.IconOverlay.Icon[key];
			if (!icon) {
				return;
			}
			let image, x, y;
			const rc = api.Memory("RECT");
			if (Id) {
				image = icon[Ctrl.IconSize < 32 ? 0 : 1];
				rc.Left = LVIR_ICON;
				api.SendMessage(hwnd, LVM_GETITEMRECT, nmcd.dwItemSpec, rc);
				const w = Ctrl.IconSize * screen.deviceYDPI / 96;
				image = GetThumbnail(image, Ctrl.IconSize < 32 ? w : (w * 5 / 16) + 16);
				x = api.SendMessage(hwnd, LVM_GETVIEW, 0, 0) == 2 ? rc.Right - w : rc.Left + (rc.Right - rc.Left - w) / 2;
				y = rc.Bottom - image.GetHeight() - 2;
			} else {
				image = icon[0];
				rc.Write(0, VT_I8, nmcd.dwItemSpec);
				api.SendMessage(hwnd, TVM_GETITEMRECT, true, rc);
				x = rc.Left - 19 * screen.deviceYDPI / 96;
				y = rc.Top + 2 * screen.deviceYDPI / 96;
			}
			if (image) {
				image.DrawEx(nmcd.hdc, x, y, 0, 0, CLR_NONE, CLR_NONE, ILD_NORMAL);
			}
		});

		AddEvent("ListViewCreated", function (Ctrl) {
			Sync.IconOverlay.db[Ctrl.Id] = {};
			if (Sync.IconOverlay.db[0] && Sync.IconOverlay.db[0][Ctrl.FolderItem.Path] != null) {
				Sync.IconOverlay.DLL.GetOverlayIconIndex(Ctrl.FolderItem.Path, api.GetAttributesOf(Ctrl.FolderItem, SFGAO_STORAGECAPMASK), 0);
			}
		});

		AddEvent("Command", function (Ctrl, hwnd, msg, wParam, lParam) {
			if (msg == WM_NULL) {
				Sync.IconOverlay.db = {};
			}
		});

		AddEvent("ChangeNotify", function (Ctrl, pidls, wParam, lParam) {
			const path = pidls[0].Path;
			for (let Id in Sync.IconOverlay.db) {
				if (Sync.IconOverlay.db[Id][path] != null) {
					Sync.IconOverlay.DLL.GetOverlayIconIndex(path, api.GetAttributesOf(pidls[0], SFGAO_STORAGECAPMASK), Id);
				}
			}
		});
	}
}

