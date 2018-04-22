var Addon_Id = "hotbutton";

var item = GetAddonElement(Addon_Id);

if (window.Addon == 1) {
	Addons.HotButton =
	{
		Up: GetAddonOptionEx("hotbutton", "Up"),
		rc: api.Memory("RECT"),

		IsHot: function (nmcd, hList, pt)
		{
			if (nmcd.uItemState & CDIS_HOT) {
				return true;
			}
		},

		GetRect: function (hList, iItem, rc)
		{
			Addons.HotButton.GetRect2(hList, iItem, rc);
			rc.Left = rc.Right - Addons.HotButton.Image.GetWidth();
			rc.Top = (rc.Top + rc.Bottom - Addons.HotButton.Image.GetHeight()) / 2;
			rc.Bottom = rc.Top + Addons.HotButton.Image.GetHeight();
		},

		GetRect2: function (hList, iItem, rc)
		{
			rc.Left = LVIR_SELECTBOUNDS;
			api.SendMessage(hList, LVM_GETITEMRECT, iItem, rc);
		}
	};

	AddEvent("ItemPostPaint2", function (Ctrl, pid, nmcd, vcd)
	{
		var hList = Ctrl.hwndList;
		if (hList && pid && Addons.HotButton.IsHot(nmcd, hList)) {
			if (Addons.HotButton.Up || pid.IsFolder) {
				if (Addons.HotButton.Image) {
					var rc = api.Memory("RECT");
					Addons.HotButton.GetRect(hList, nmcd.dwItemSpec, rc);
					if (rc.Left != Addons.HotButton.rc.Left || rc.Top != Addons.HotButton.rc.Top) {
						api.InvalidateRect(hList, Addons.HotButton.rc, true);
						Addons.HotButton.rc = rc;
					}
					Addons.HotButton.Image.DrawEx(nmcd.hdc, rc.Left, rc.Top, 0, 0, CLR_NONE, CLR_NONE, ILD_NORMAL);
				}
			}
		}
	});

	AddEvent("MouseMessage", function (Ctrl, hwnd, msg, wParam, pt)
	{
		var hList = Ctrl.hwndList;
		if (hList && msg == WM_LBUTTONDOWN) {
			var iItem = Ctrl.HitTest(pt, LVHT_ONITEM);
			if (iItem >= 0) {
				var rc = api.Memory("RECT");
				Addons.HotButton.GetRect(hList, iItem, rc);
				var ptc = pt.Clone();
				api.ScreenToClient(hList, ptc);
				if (PtInRect(rc, ptc)) {
					(function (Ctrl) { setTimeout(function ()
					{
						var Items = Ctrl.Items();
						var Item = Items.Item(iItem);
						Addons.HotButton.MenuLoop = true;
						Addons.HotButton.MenuSelect = -1;
						Addons.HotButton.ptDown = null;
						var FolderItem = FolderMenu.Open(api.ILIsEqual(Ctrl.FolderItem.Alt, ssfRESULTSFOLDER) ? Item.Path : Item, pt.x, pt.y, "*", !Addons.HotButton.Up);
						Addons.HotButton.MenuLoop = false;
						if (FolderItem) {
							FolderMenu.Invoke(FolderItem);
						}
					}, 99)})(Ctrl);
					return S_OK;
				}
			}
		}
		if (Addons.HotButton.MenuLoop) {
			if (msg == WM_LBUTTONDOWN || msg == WM_RBUTTONDOWN) {
				Addons.HotButton.ptDown = pt;
				Addons.HotButton.MenuDown = Addons.HotButton.MenuSelect;
			} else if (msg == WM_LBUTTONUP || msg == WM_RBUTTONUP) {
				delete Addons.HotButton.ptDown;
			} else if (msg == WM_MOUSEMOVE && Addons.HotButton.ptDown && IsDrag(pt, Addons.HotButton.ptDown)) {
				delete Addons.HotButton.ptDown;
				var FolderItem = FolderMenu.Items[Addons.HotButton.MenuDown - 1];
				if (FolderItem) {
					var pdwEffect = [DROPEFFECT_COPY | DROPEFFECT_MOVE | DROPEFFECT_LINK];
					api.SHDoDragDrop(null, FolderItem, te, pdwEffect[0], pdwEffect, true);
				}
			}
		}
	});

	AddEvent("MenuMessage", function (Ctrl, hwnd, msg, wParam, lParam)
	{
		if (Addons.HotButton.MenuLoop && msg == WM_MENUSELECT) {
			Addons.HotButton.MenuSelect = wParam & 0xffff;
		}
	});

	//Image
	var image = te.WICBitmap();
	var s = api.PathUnquoteSpaces(ExtractMacro(te, item.getAttribute("Img")));
	if (s) {
		Addons.HotButton.Image = image.FromFile(s);
		if (Addons.HotButton.Image) {
			return;
		}
	}
	var hdc = api.GetDC(te.hwnd);
	var rc = api.Memory("RECT");
	var w = 14 * screen.logicalYDPI / 96;
	rc.Right = w;
	rc.Bottom = w;
	var hbm = api.CreateCompatibleBitmap(hdc, w, w);
	var hmdc = api.CreateCompatibleDC(hdc);
	var hOld = api.SelectObject(hmdc, hbm);
	api.Rectangle(hmdc, rc.Left, rc.Top, rc.Right, rc.Bottom);
	api.SetTextColor(hmdc, 0x333333);
	api.SetBkMode(hmdc, 1);
	var lf = api.Memory("LOGFONT");
	lf.lfFaceName = "Arial Black",
	lf.lfHeight = - w;
	var hFont = CreateFont(lf);
	var hfontOld = api.SelectObject(hmdc, hFont);
	rc.Top = -w / 4;
	api.DrawText(hmdc, "▼", -1, rc, DT_CENTER);
	api.SelectObject(hmdc, hfontOld);
	api.DeleteDC(hmdc);
	api.SelectObject(hmdc, hOld);
	Addons.HotButton.Image = image.FromHBITMAP(hbm);
	api.DeleteObject(hbm);
	api.ReleaseDC(te.hwnd, hdc);
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
					rc.Left = LVIR_SELECTBOUNDS;
					api.SendMessage(hList, LVM_GETITEMRECT, iItem, rc);
					return;
				}
				rc.Left = LVIR_ICON;
				api.SendMessage(hList, LVM_GETITEMRECT, iItem, rc);
				var item = api.Memory("LVITEM");
				item.mask = LVIF_TEXT;
				item.pszText = api.Memory("WCHAR", 260);
				item.cchTextMax = 260;
				item.iItem = iItem;
				api.SendMessage(hList, 0x104B, 0, item);
				rc.Right += api.SendMessage(hList, LVM_GETSTRINGWIDTH, 0, item.pszText) + 4;
			}
		}
	});
} else {
	SetTabContents(0, "General", '<input type="checkbox" id="Up" /><label for="Up">Up</label>');
}
