const Addon_Id = "hotbutton";
const item = GetAddonElement(Addon_Id);

Sync.HotButton = {
	rc: api.Memory("RECT"),
	Select: item.getAttribute("Select"),
	NoInfotip: item.getAttribute("NoInfotip"),
	Handled: false,

	IsHot: function (nmcd, hList) {
		if (nmcd.uItemState & CDIS_HOT) {
			return true;
		}
	},

	GetRect: function (hList, iItem, rc) {
		Sync.HotButton.GetRect2(hList, iItem, rc);
		rc.left = rc.right - Sync.HotButton.Image.GetWidth();
		const h = Sync.HotButton.Image.GetHeight();
		if (rc.bottom - rc.top > h * 2) {
			rc.top = (rc.top + rc.bottom - h) / 2;
			rc.bottom = rc.top + h;
		}
	},

	GetRect2: function (hList, iItem, rc) {
		rc.left = LVIR_SELECTBOUNDS;
		api.SendMessage(hList, LVM_GETITEMRECT, iItem, rc);
	}
};

AddEvent("ItemPostPaint2", function (Ctrl, pid, nmcd, vcd) {
	const hList = Ctrl.hwndList;
	if (hList && pid && Sync.HotButton.IsHot(nmcd, hList)) {
		if (pid.IsFolder || api.ILCreateFromPath(pid.Path).Enum) {
			if (Sync.HotButton.Image) {
				const rc = api.Memory("RECT");
				Sync.HotButton.GetRect(hList, nmcd.dwItemSpec, rc);
				if (rc.left != Sync.HotButton.rc.left || rc.top != Sync.HotButton.rc.top) {
					api.InvalidateRect(hList, Sync.HotButton.rc, true);
					Sync.HotButton.rc = rc;
				}
				Sync.HotButton.Image.DrawEx(nmcd.hdc, rc.left, (rc.top + rc.bottom - Sync.HotButton.Image.GetHeight()) / 2, 0, 0, CLR_NONE, CLR_NONE, ILD_NORMAL);
			}
		}
	}
});

AddEvent("MouseMessage", function (Ctrl, hwnd, msg, wParam, pt) {
	const hList = Ctrl.hwndList;
	if (hList) {
		if (msg == WM_LBUTTONDOWN) {
			Sync.HotButton.Handled = false;
			const iItem = Ctrl.HitTest(pt, LVHT_ONITEM);
			if (iItem >= 0) {
				const rc = api.Memory("RECT");
				Sync.HotButton.GetRect(hList, iItem, rc);
				const ptc = pt.Clone();
				api.ScreenToClient(hList, ptc);
				if (PtInRect(rc, ptc)) {
					if (Sync.HotButton.Select) {
						Ctrl.SelectItem(Ctrl.Item(iItem), SVSI_SELECT | (api.GetKeyState(VK_CONTROL) < 0 ? 0 : SVSI_DESELECTOTHERS));
					}
					Sync.HotButton.Handled = true;
					return S_OK;
				}
			}
		} else if (Sync.HotButton.Handled && msg == WM_LBUTTONUP) {
			const iItem = Ctrl.HitTest(pt, LVHT_ONITEM);
			if (iItem >= 0) {
				const rc = api.Memory("RECT");
				Sync.HotButton.GetRect(hList, iItem, rc);
				const ptc = pt.Clone();
				api.ScreenToClient(hList, ptc);
				if (PtInRect(rc, ptc)) {
					const ptm = api.Memory("POINT");
					ptm.x = rc.right;
					ptm.y = rc.top;
					api.ClientToScreen(Ctrl.hwndList, ptm);
					setTimeout(function (Item, ptm) {
						const hwnd = Sync.HotButton.hTooltop;
						if (hwnd && api.IsWindowVisible(hwnd)) {
							api.ShowWindow(hwnd, SW_HIDE);
						}
						Sync.HotButton.IsMenuOpened = true;
						const FolderItem = FolderMenu.Open(Item, ptm.x, ptm.y, "*", 1);
						Sync.HotButton.IsMenuOpened = false;
						if (FolderItem) {
							FolderMenu.Invoke(FolderItem);
						}
					}, 99, api.ILCreateFromPath(Ctrl.Item(iItem).Path), ptm);
					return S_OK;
				}
			}
		}
	}
});

AddEvent("Load", function () {
	if (WINVER < 0x600 || !api.IsAppThemed() || Sync.ClassicStyle) {
		Sync.HotButton.IsHot = function (nmcd, hList) {
			const rc = api.Memory("RECT");
			Sync.HotButton.GetRect2(hList, nmcd.dwItemSpec, rc);
			const pt = api.Memory("POINT");
			api.GetCursorPos(pt);
			api.ScreenToClient(hList, pt);
			return PtInRect(rc, pt);
		}

		Sync.HotButton.GetRect2 = function (hList, iItem, rc) {
			const vm = api.SendMessage(hList, LVM_GETVIEW, 0, 0);
			if (vm != 3) {
				rc.left = LVIR_SELECTBOUNDS;
				api.SendMessage(hList, LVM_GETITEMRECT, iItem, rc);
				return;
			}
			rc.left = LVIR_ICON;
			api.SendMessage(hList, LVM_GETITEMRECT, iItem, rc);
			const item = api.Memory("LVITEM");
			item.mask = LVIF_TEXT;
			item.pszText = api.Memory("WCHAR", 260);
			item.cchTextMax = 260;
			item.iItem = iItem;
			api.SendMessage(hList, LVM_GETITEM, 0, item);
			rc.right += api.SendMessage(hList, LVM_GETSTRINGWIDTH, 0, item.pszText) + 4;
		}
	}
});

AddEvent("ToolTip", function (Ctrl, Index, hwnd) {
	if (Ctrl.Type == CTRL_SB) {
		if (Index >= 0) {
			const pid = Ctrl.Item(Index);
			if (pid) {
				if (pid.IsFolder || api.ILCreateFromPath(pid.Path).Enum) {
					if (Sync.HotButton.NoInfotip || Sync.HotButton.IsMenuOpened) {
						return "";
					}
				}
			}
		}
	} else if (Ctrl.Type == CTRL_TE) {
		Sync.HotButton.hTooltop = hwnd;
	}
}, true);

//Image
const w = 14 * screen.deviceYDPI / 96;
const s = ExtractPath(te, item.getAttribute("Icon"));
if (s) {
	Sync.HotButton.Image = MakeImgData(s, 0, w) || api.CreateObject("WICBitmap").FromFile(s);
}
if (Sync.HotButton.Image) {
	Sync.HotButton.Image = GetThumbnail(Sync.HotButton.Image, w);
} else {
	const hdc = api.GetDC(te.hwnd);
	const rc = api.Memory("RECT");
	api.SetRect(rc, 0, 0, w, w);
	const hbm = api.CreateCompatibleBitmap(hdc, w, w);
	const hmdc = api.CreateCompatibleDC(hdc);
	const hOld = api.SelectObject(hmdc, hbm);
	api.Rectangle(hmdc, rc.left, rc.top, rc.right, rc.bottom);
	api.SetTextColor(hmdc, 0x333333);
	api.SetBkMode(hmdc, 1);
	const lf = api.Memory("LOGFONT");
	lf.lfFaceName = "Consolas";
	lf.lfHeight = -w;
	const hFont = CreateFont(lf);
	const hfontOld = api.SelectObject(hmdc, hFont);
	rc.top = 1 - w / 4;
	api.DrawText(hmdc, ">", -1, rc, DT_CENTER);
	api.SelectObject(hmdc, hfontOld);
	api.SelectObject(hmdc, hOld);
	api.DeleteDC(hmdc);
	Sync.HotButton.Image = api.CreateObject("WICBitmap").FromHBITMAP(hbm);
	api.DeleteObject(hbm);
	api.ReleaseDC(te.hwnd, hdc);
}
