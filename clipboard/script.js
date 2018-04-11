var Addon_Id = "clipboard";
var Default = "ToolBar2Left";

if (window.Addon == 1) {
	Addons.ClipBoard =
	{
		Init: function ()
		{
			var n = window.IconSize == 16 ? 16 : 24;
			s = ['<span id="Clipboard" class="button" onclick="Addons.ClipBoard.Click(this)" oncontextmenu="Addons.ClipBoard.Popup(this); return false;" ondrag="Addons.ClipBoard.Drag(this); return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()" draggable="true"><img alt="Clipboard" src="../addons/clipboard/', n, '.png"></span>'];
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
				for (var i = 0; i < Items.Count; i++) {
					var FolderItem = Items.Item(i);
					AddMenuIconFolderItem(mii, FolderItem);
					mii.dwTypeData = api.GetDisplayNameOf(FolderItem, SHGDN_INFOLDER | SHGDN_ORIGINAL);
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
		}, 99);}) (o); },

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
		}, 99);}) (o); },

		Drag: function (o)
		{
			var Items = api.OleGetClipboard();
			if (Items && Items.Count) {
				api.SHDoDragDrop(null, Items, te, DROPEFFECT_COPY | DROPEFFECT_MOVE | DROPEFFECT_LINK, Items.pdwEffect);
			}
			MouseOut();
		}

	};

	AddEvent("DragEnter", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		if (Ctrl.Type == CTRL_WB) {
			return S_OK;
		}
	});

	AddEvent("DragOver", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		var o = document.getElementById("Clipboard");
		if (HitTest(o, pt)) {
			Addons.ClipBoard.grfKeyState = grfKeyState;
			pdwEffect[0] = (grfKeyState & MK_SHIFT) ? DROPEFFECT_MOVE : DROPEFFECT_COPY;
			MouseOver(o);
			return S_OK;
		}
		MouseOut("Clipboard");
	});

	AddEvent("Drop", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		MouseOut();
		if (HitTest(document.getElementById("Clipboard"), pt)) {
			dataObj.dwEffect = (Addons.ClipBoard.grfKeyState & MK_SHIFT) ? DROPEFFECT_MOVE : DROPEFFECT_COPY | DROPEFFECT_LINK;
			api.OleSetClipboard(dataObj);
			return S_OK;
		}
	});

	AddEvent("DragLeave", function (Ctrl)
	{
		MouseOut();
	});

	Addons.ClipBoard.Init();
}
