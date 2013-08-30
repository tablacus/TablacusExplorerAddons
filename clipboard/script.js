var Addon_Id = "clipboard";
var Default = "ToolBar2Left";

if (!window.dialogArguments) {
	g_clipboard =
	{
		DragEnter: te.OnDragEnter,
		DragOver: te.OnDragOver,
		Drop: te.OnDrop,
		DragLeave: te.OnDragleave,

		Init: function ()
		{
			var n = window.IconSize == 16 ? 16 : 24;
			var s = '<img alt="Clipboard" src="../addons/clipboard/' + n + '.png">'
			s = '<span id="Clipboard" class="button" onclick="g_clipboard.Click(this)" oncontextmenu="g_clipboard.Popup(this); return false;" ondrag="g_clipboard.Drag(this); return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()">' + s + '</span><span style="width: 1px"> </span>';
			SetAddon(Addon_Id, Default, s);
		},

		Click: function (o) { (function (o) { setTimeout(function () 
		{
			var Items = api.OleGetClipboard();
			var hMenu = te.MainMenu(FCIDM_MENU_EDIT);
			var Selected = null;
			var FV = te.Ctrl(CTRL_FV);
			if (FV) {
				Selected = FV.SelectedItems();
				var i = api.GetMenuItemCount(hMenu);
				while (--i >= 0) {
					var wID = api.GetMenuItemID(hMenu, i) & 0xfff;
					if (wID == CommandID_CUT - 1 || wID == CommandID_COPY - 1) {
						if (!Selected || Selected.Count == 0) {
							api.EnableMenuItem(hMenu, i, MF_BYPOSITION | MF_GRAYED);
						}
					}
					else if (wID == CommandID_PASTE - 1) {
						if (!Items || Items.Count == 0) {
							api.EnableMenuItem(hMenu, i, MF_BYPOSITION | MF_GRAYED);
						}
					}
					else {
						api.DeleteMenu(hMenu, i, MF_BYPOSITION);
					}
				}
			}
			if (Items && Items.Count) {
				var s = "";
				if (Items.dwEffect & DROPEFFECT_COPY) {
					s += GetText("Copy") + " ";
				}
				if (Items.dwEffect & DROPEFFECT_MOVE) {
					s += GetText("Cut") + " ";
				}
				api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_SEPARATOR, 0, null);
				api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, 0, s);
				api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_SEPARATOR, 0, null);
				var mii = api.Memory("MENUITEMINFO");
				mii.cbSize = mii.Size;
				mii.fMask  = MIIM_ID | MIIM_STRING | MIIM_BITMAP;
				var arBM = new Array();
				for (var i = 0; i < Items.Count; i++) {
					var FolderItem = Items.Item(i);
					var s = ' ' + api.GetDisplayNameOf(FolderItem, SHGDN_INFOLDER);
					var sz = api.Memory(s.length * 2 + 2);
					sz.Write(0, VT_LPWSTR, s);
					mii.dwTypeData = sz.P;
					var image = te.GdiplusBitmap;
					var info = api.Memory("SHFILEINFO");
					api.ShGetFileInfo(FolderItem, 0, info, info.Size, SHGFI_ICON | SHGFI_SMALLICON | SHGFI_PIDL);
					var hIcon = info.hIcon;
					var cl = api.GetSysColor(COLOR_BTNFACE);
					image.FromHICON(hIcon, cl);
					api.DestroyIcon(hIcon);
					mii.hbmpItem = image.GetHBITMAP(cl);
					arBM.push(mii.hbmpItem);
					mii.wID = 0;
					api.InsertMenuItem(hMenu, MAXINT, false, mii);
				}
			}
			var pt = GetPos(o, true);
			pt.y = pt.y + o.offsetHeight;
			var nVerb = api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null, null);
			api.DestroyMenu(hMenu);
			if (FV && nVerb) {
				api.SendMessage(FV.hwndView, WM_COMMAND, nVerb, 0);
			}
		}, 100);}) (o); },

		Popup: function (o) { (function (o) { setTimeout(function () 
		{
			var Items = api.OleGetClipboard();
			if (Items && Items.Count) {
				var hMenu = api.CreatePopupMenu();
				var ContextMenu = api.ContextMenu(Items);
				if (ContextMenu) {
					ContextMenu.QueryContextMenu(hMenu, 0, 0x1001, 0x7FFF, CMF_NORMAL);
				}
				var pt = api.Memory("POINT");
				api.GetCursorPos(pt);
				var nVerb = api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null, ContextMenu);
				if (nVerb >= 0x1001) {
					ContextMenu.InvokeCommand(0, te.hwnd, nVerb - 0x1001, null, null, SW_SHOWNORMAL, 0, 0);
				}
			}
		}, 100);}) (o); },

		Drag: function (o)
		{
			var Items = api.OleGetClipboard();
			if (Items && Items.Count) {
				api.DoDragDrop(Items, DROPEFFECT_COPY | DROPEFFECT_MOVE | DROPEFFECT_LINK, Items.pdwEffect);
			}
			MouseOut();
		}

	};

	te.OnDragEnter = function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		var hr = g_clipboard.DragEnter ? g_clipboard.DragEnter(Ctrl, dataObj, grfKeyState, pt, pdwEffect) : E_FAIL;
		if (Ctrl.Type == CTRL_WB) {
			hr = S_OK;
		}
		return hr;
	}

	te.OnDragOver = function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		var o = document.getElementById("Clipboard");
		if (HitTest(o, pt)) {
			g_clipboard.grfKeyState = grfKeyState;
			pdwEffect.x = (grfKeyState & MK_SHIFT) ? DROPEFFECT_MOVE : DROPEFFECT_COPY;
			MouseOver(o);
			return S_OK;
		}
		MouseOut("Clipboard");
		return g_clipboard.DragOver ? g_clipboard.DragOver(Ctrl, dataObj, grfKeyState, pt, pdwEffect) : E_FAIL;
	}

	te.OnDrop = function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		MouseOut();
		if (HitTest(document.getElementById("Clipboard"), pt)) {
			dataObj.dwEffect = (g_clipboard.grfKeyState & MK_SHIFT) ? DROPEFFECT_MOVE : DROPEFFECT_COPY | DROPEFFECT_LINK;
			api.OleSetClipboard(dataObj);
			return S_OK;
		}
		return g_clipboard.Drop ? g_clipboard.Drop(Ctrl, dataObj, grfKeyState, pt, pdwEffect) : E_FAIL;
	}

	te.OnDragleave = function (Ctrl)
	{
		MouseOut();
		return g_clipboard.DragLeave ? g_clipboard.DragLeave(Ctrl): S_OK;
	}

	g_clipboard.Init();
}
