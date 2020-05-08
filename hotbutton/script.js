var Addon_Id = "hotbutton";

var item = GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.HotButton =
	{
		rc: api.Memory("RECT"),
		Select: item.getAttribute("Select"),
		Handled: false,

		IsHot: function (nmcd, hList)
		{
			if (nmcd.uItemState & CDIS_HOT) {
				return true;
			}
		},

		GetRect: function (hList, iItem, rc)
		{
			Addons.HotButton.GetRect2(hList, iItem, rc);
			rc.left = rc.right - Addons.HotButton.Image.GetWidth();
			var h = Addons.HotButton.Image.GetHeight();
			if (rc.bottom - rc.top > h * 2) {
				rc.top = (rc.top + rc.bottom - h) / 2;
				rc.bottom = rc.top + h;
			}
		},

		GetRect2: function (hList, iItem, rc)
		{
			rc.left = LVIR_SELECTBOUNDS;
			api.SendMessage(hList, LVM_GETITEMRECT, iItem, rc);
		}
	};

	AddEvent("ItemPostPaint2", function (Ctrl, pid, nmcd, vcd)
	{
		var hList = Ctrl.hwndList;
		if (hList && pid && Addons.HotButton.IsHot(nmcd, hList)) {
			if (pid.IsFolder || api.ILCreateFromPath(pid.Path).Enum) {
				if (Addons.HotButton.Image) {
					var rc = api.Memory("RECT");
					Addons.HotButton.GetRect(hList, nmcd.dwItemSpec, rc);
					if (rc.left != Addons.HotButton.rc.left || rc.top != Addons.HotButton.rc.top) {
						api.InvalidateRect(hList, Addons.HotButton.rc, true);
						Addons.HotButton.rc = rc;
					}
					Addons.HotButton.Image.DrawEx(nmcd.hdc, rc.left, (rc.top + rc.bottom - Addons.HotButton.Image.GetHeight()) / 2, 0, 0, CLR_NONE, CLR_NONE, ILD_NORMAL);
				}
			}
		}
	});

	AddEvent("MouseMessage", function (Ctrl, hwnd, msg, wParam, pt)
	{
		var hList = Ctrl.hwndList;
		if (hList) {
			if (msg == WM_LBUTTONDOWN) {
				Addons.HotButton.Handled = false;
				var iItem = Ctrl.HitTest(pt, LVHT_ONITEM);
				if (iItem >= 0) {
					var rc = api.Memory("RECT");
					Addons.HotButton.GetRect(hList, iItem, rc);
					var ptc = pt.Clone();
					api.ScreenToClient(hList, ptc);
					if (PtInRect(rc, ptc)) {
						if (Addons.HotButton.Select) {
							Ctrl.SelectItem(Ctrl.Item(iItem), SVSI_SELECT | (api.GetKeyState(VK_CONTROL) < 0 ? 0 :SVSI_DESELECTOTHERS));
						}
						Addons.HotButton.Handled = true;
						return S_OK;
					}
				}
			} else if (Addons.HotButton.Handled && msg == WM_LBUTTONUP) {
				var iItem = Ctrl.HitTest(pt, LVHT_ONITEM);
				if (iItem >= 0) {
					var rc = api.Memory("RECT");
					Addons.HotButton.GetRect(hList, iItem, rc);
					var ptc = pt.Clone();
					api.ScreenToClient(hList, ptc);
					if (PtInRect(rc, ptc)) {
						var ptm = api.Memory("POINT");
						ptm.x = rc.right;
						ptm.y = rc.top;
						api.ClientToScreen(Ctrl.hwndList, ptm);
						(function (Item, ptm) { setTimeout(function ()
						{
							var FolderItem = FolderMenu.Open(Item, ptm.x, ptm.y, "*", 1);
							if (FolderItem) {
								FolderMenu.Invoke(FolderItem);
							}
						}, 99)})(api.ILCreateFromPath(Ctrl.Item(iItem).Path), ptm);
						return S_OK;
					}
				}
			}
		}
	});

	AddEvent("Load", function ()
	{
		if (WINVER < 0x600 || !api.IsAppThemed() || Addons.ClassicStyle) {
			Addons.HotButton.IsHot = function (nmcd, hList)
			{
				var rc = api.Memory("RECT");
				Addons.HotButton.GetRect2(hList, nmcd.dwItemSpec, rc);
				var pt = api.Memory("POINT");
				api.GetCursorPos(pt);
				api.ScreenToClient(hList, pt);
				return PtInRect(rc, pt);
			}

			Addons.HotButton.GetRect2 = function (hList, iItem, rc)
			{
				var vm = api.SendMessage(hList, LVM_GETVIEW, 0, 0);
				if (vm != 3) {
					rc.left = LVIR_SELECTBOUNDS;
					api.SendMessage(hList, LVM_GETITEMRECT, iItem, rc);
					return;
				}
				rc.left = LVIR_ICON;
				api.SendMessage(hList, LVM_GETITEMRECT, iItem, rc);
				var item = api.Memory("LVITEM");
				item.mask = LVIF_TEXT;
				item.pszText = api.Memory("WCHAR", 260);
				item.cchTextMax = 260;
				item.iItem = iItem;
				api.SendMessage(hList, LVM_GETITEM, 0, item);
				rc.right += api.SendMessage(hList, LVM_GETSTRINGWIDTH, 0, item.pszText) + 4;
			}
		}
	});

	//Image
	var w = 14 * screen.logicalYDPI / 96;
	var s = api.PathUnquoteSpaces(ExtractMacro(te, item.getAttribute("Icon")));
	if (s) {
		Addons.HotButton.Image = MakeImgData(s, 0, w) || api.CreateObject("WICBitmap").FromFile(s);
	}
	if (Addons.HotButton.Image) {
		Addons.HotButton.Image = GetThumbnail(Addons.HotButton.Image, w);
	} else {
		var hdc = api.GetDC(te.hwnd);
		var rc = api.Memory("RECT");
		rc.right = w;
		rc.bottom = w;
		var hbm = api.CreateCompatibleBitmap(hdc, w, w);
		var hmdc = api.CreateCompatibleDC(hdc);
		var hOld = api.SelectObject(hmdc, hbm);
		api.Rectangle(hmdc, rc.left, rc.top, rc.right, rc.bottom);
		api.SetTextColor(hmdc, 0x333333);
		api.SetBkMode(hmdc, 1);
		var lf = api.Memory("LOGFONT");
		lf.lfFaceName = "Consolas";
		lf.lfHeight = -w;
		var hFont = CreateFont(lf);
		var hfontOld = api.SelectObject(hmdc, hFont);
		rc.top = 1 - w / 4;
		api.DrawText(hmdc, ">", -1, rc, DT_CENTER);
		api.SelectObject(hmdc, hfontOld);
		api.SelectObject(hmdc, hOld);
		api.DeleteDC(hmdc);
		Addons.HotButton.Image = api.CreateObject("WICBitmap").FromHBITMAP(hbm);
		api.DeleteObject(hbm);
		api.ReleaseDC(te.hwnd, hdc);
	}
} else {
	SetTabContents(0, "General", '<label><input type="checkbox" id="Select" />Select</label>');
	ChangeForm([["__IconSize", "style/display", "none"]]);
}
