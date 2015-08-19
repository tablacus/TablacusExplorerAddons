Addon_Id = "clipboardhistory";

var items = te.Data.Addons.getElementsByTagName(Addon_Id);
if (items.length) {
	var item = items[0];
	if (!item.getAttribute("Set")) {
		item.setAttribute("MenuExec", 1);
		item.setAttribute("Menu", "Background");
		item.setAttribute("MenuPos", 0);

		item.setAttribute("KeyOn", "List");
		item.setAttribute("MouseOn", "List");

		item.setAttribute("Save", 15);
	}
}
if (window.Addon == 1) {
	Addons.ClipboardHistory =
	{
		Save: 15,
		nCommand: 1,
		Bitmap: [],

		Exec: function (Ctrl, pt)
		{
			Addons.ClipboardHistory.nCommand = 1;
			var hMenu = Addons.ClipboardHistory.CreateMenu();
			Addons.ClipboardHistory.MenuCommand(Ctrl, pt, "", api.TrackPopupMenuEx(hMenu, TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null, null), hMenu);
			api.DestroyMenu(hMenu);
			return S_OK;
		},

		MenuCommand: function (Ctrl, pt, Name, nVerb, hMenu)
		{
			nVerb -= Addons.ClipboardHistory.nCommand;
			if (nVerb >= 0 && nVerb < te.Data.ClipboardHistory.length) {
				var FV = GetFolderView(Ctrl, pt);
				if (FV) {
					var DropTarget = FV.DropTarget;
					if (DropTarget) {
						var dataObj = te.Data.ClipboardHistory[nVerb];
						var pdwEffect = [DROPEFFECT_COPY | DROPEFFECT_MOVE | DROPEFFECT_LINK];
						DropTarget.Drop(dataObj, MK_RBUTTON | (dataObj.dwEffect == 2 ? MK_SHIFT : 0), pt, pdwEffect);
					}
				}
				return S_OK;
			}
		},

		CreateMenu: function ()
		{
			var hMenu = api.CreatePopupMenu();
			for (var i = 0; i < te.Data.ClipboardHistory.length; i++) {
				var Items = te.Data.ClipboardHistory[i];
				var s = [api.GetDisplayNameOf(Items.Item(0), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING)];
				if (Items.Count > 1) {
					s.unshift(Items.Count)
					s.push("...");
				}

				var mii = api.Memory("MENUITEMINFO");
				mii.cbSize = mii.Size;
				mii.fMask = MIIM_STRING | MIIM_ID | MIIM_BITMAP;
				mii.dwTypeData = s.join(" ");
				mii.wId = i + this.nCommand;
				mii.hbmpItem = this.Bitmap[Items.dwEffect & 1];
				api.InsertMenuItem(hMenu, MAXINT, true, mii);
			}
			return hMenu;
		},

		Add: function (Items)
		{
			if (!Items || !Items.Count) {
				return;
			}
			if (te.Data.ClipboardHistory.length) {
				var Items0 = te.Data.ClipboardHistory[0];
				if (Items.Count == Items0.Count && Items.dwEffect == Items0.dwEffect) {
					bSame = true;
					for (var i = Items.Count; i--;) {
						if (api.GetDisplayNameOf(Items.Item(i), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_FORPARSINGEX) != api.GetDisplayNameOf(Items0.Item(i), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_FORPARSINGEX)) {
							bSame = false;
						}
					}
					if (bSame) {
						return;
					}
				}
			}
			te.Data.ClipboardHistory.unshift(Items);
			te.Data.ClipboardHistory.splice(this.Save);
		}
	}

	if (items.length) {
		Addons.ClipboardHistory.Save = item.getAttribute("Save") || 15;
		var s = item.getAttribute("MenuName");
		if (!s || s == "") {
			var info = GetAddonInfo(Addon_Id);
			s = info.Name;
		}
		Addons.ClipboardHistory.strName = GetText(s);
		//Menu
		if (item.getAttribute("MenuExec")) {
			Addons.ClipboardHistory.nPos = api.LowPart(item.getAttribute("MenuPos"));
			AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos, Selected, item)
			{
				if (te.Data.ClipboardHistory.length) {
					Addons.ClipboardHistory.nCommand = nPos + 1;
					var mii = api.Memory("MENUITEMINFO");
					mii.cbSize = mii.Size;
					mii.fMask = MIIM_STRING | MIIM_SUBMENU;
					mii.dwTypeData = Addons.ClipboardHistory.strName;
					mii.hSubMenu = Addons.ClipboardHistory.CreateMenu();
					api.InsertMenuItem(hMenu, Addons.ClipboardHistory.nPos, true, mii);
					AddEvent("MenuCommand", Addons.ClipboardHistory.MenuCommand);
					nPos += te.Data.ClipboardHistory.length;
				}
				return nPos;
			});
		}
		//Key
		if (item.getAttribute("KeyExec")) {
			SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.ClipboardHistory.Exec, "Func");
		}
		//Mouse
		if (item.getAttribute("MouseExec")) {
			SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.ClipboardHistory.Exec, "Func");
		}

		AddTypeEx("Add-ons", "Clipboard list", Addons.ClipboardHistory.Exec);
	}

	AddEvent("SystemMessage", function (Ctrl, hwnd, msg, wParam, lParam)
	{
		if (msg == WM_CLIPBOARDUPDATE) {
			Addons.ClipboardHistory.Add(api.OleGetClipboard());
		}
	});

	AddEventEx(window, "beforeunload", function ()
	{
		for (var i = 2; i--;) {
			api.DeleteObject(Addons.ClipboardHistory.Bitmap[i]);
		}
	});
	for (var i = 2; i--;) {
		Addons.ClipboardHistory.Bitmap[i] = MakeImgData("bitmap:ieframe.dll,216,16," + (5 + i), 0, false, 16).GetHBITMAP(WINVER >= 0x600 ? null : GetSysColor(COLOR_MENU));
	}

	if (!te.Data.ClipboardHistory) {
		te.Data.ClipboardHistory = te.Array();
	}
}
else {
	document.getElementById("tab0").value = "General";
	document.getElementById("panel0").innerHTML = '<table style="width: 100%"><tr><td><label>Menus</label></td></tr><tr><td><input type="text" name="Save" size="4" /></td><td><input type="button" value="Default" onclick="document.F.Save.value=15" /></td></tr></table>';
}
