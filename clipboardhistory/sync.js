const Addon_Id = "clipboardhistory";
const item = GetAddonElement(Addon_Id);

Sync.ClipboardHistory = {
	Save: item.getAttribute("Save") || 15,
	strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
	nPos: GetNum(item.getAttribute("MenuPos")),
	nCommand: 1,
	Bitmap: [],

	Exec: function (Ctrl, pt) {
		Sync.ClipboardHistory.nCommand = 1;
		const hMenu = Sync.ClipboardHistory.CreateMenu();
		Sync.ClipboardHistory.MenuCommand(Ctrl, pt, "", api.TrackPopupMenuEx(hMenu, TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null, null), hMenu);
		api.DestroyMenu(hMenu);
		return S_OK;
	},

	MenuCommand: function (Ctrl, pt, Name, nVerb, hMenu) {
		nVerb -= Sync.ClipboardHistory.nCommand;
		if (nVerb >= 0 && nVerb < te.Data.ClipboardHistory.length) {
			const FV = GetFolderView(Ctrl, pt);
			if (FV) {
				const DropTarget = FV.DropTarget;
				if (DropTarget) {
					const dataObj = te.Data.ClipboardHistory[nVerb];
					const pdwEffect = [DROPEFFECT_COPY | DROPEFFECT_MOVE | DROPEFFECT_LINK];
					DropTarget.Drop(dataObj, MK_RBUTTON | (dataObj.dwEffect == 2 ? MK_SHIFT : 0), pt, pdwEffect);
				}
			}
			return S_OK;
		}
	},

	CreateMenu: function () {
		const hMenu = api.CreatePopupMenu();
		for (let i = 0; i < te.Data.ClipboardHistory.length; i++) {
			const Items = te.Data.ClipboardHistory[i];
			const s = [api.GetDisplayNameOf(Items.Item(0), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING)];
			if (Items.Count > 1) {
				s.unshift(Items.Count)
				s.push("...");
			}

			const mii = api.Memory("MENUITEMINFO");
			mii.fMask = MIIM_STRING | MIIM_ID | MIIM_BITMAP;
			mii.dwTypeData = s.join(" ");
			mii.wId = i + this.nCommand;
			mii.hbmpItem = this.Bitmap[Items.dwEffect & 1];
			api.InsertMenuItem(hMenu, MAXINT, true, mii);
		}
		return hMenu;
	},

	Add: function (Items) {
		if (!Items || !Items.Count) {
			return;
		}
		if (te.Data.ClipboardHistory.length) {
			const Items0 = te.Data.ClipboardHistory[0];
			if (Items.Count == Items0.Count && Items.dwEffect == Items0.dwEffect) {
				bSame = true;
				for (let i = Items.Count; i--;) {
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

//Menu
if (item.getAttribute("MenuExec")) {
	AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos, Selected, item) {
		if (te.Data.ClipboardHistory.length) {
			Sync.ClipboardHistory.nCommand = nPos + 1;
			const mii = api.Memory("MENUITEMINFO");
			mii.fMask = MIIM_STRING | MIIM_SUBMENU;
			mii.dwTypeData = Sync.ClipboardHistory.strName;
			mii.hSubMenu = Sync.ClipboardHistory.CreateMenu();
			api.InsertMenuItem(hMenu, Sync.ClipboardHistory.nPos, true, mii);
			AddEvent("MenuCommand", Sync.ClipboardHistory.MenuCommand);
			nPos += te.Data.ClipboardHistory.length;
		}
		return nPos;
	});
}
//Key
if (item.getAttribute("KeyExec")) {
	SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Sync.ClipboardHistory.Exec, "Func");
}
//Mouse
if (item.getAttribute("MouseExec")) {
	SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Sync.ClipboardHistory.Exec, "Func");
}

AddTypeEx("Add-ons", "Clipboard list", Sync.ClipboardHistory.Exec);

AddEvent("SystemMessage", function (Ctrl, hwnd, msg, wParam, lParam) {
	if (msg == WM_CLIPBOARDUPDATE) {
		Sync.ClipboardHistory.Add(api.OleGetClipboard());
	}
});

AddEvent("Finalize", function () {
	for (let i = 2; i--;) {
		api.DeleteObject(Sync.ClipboardHistory.Bitmap[i]);
	}
});
for (let i = 2; i--;) {
	Sync.ClipboardHistory.Bitmap[i] = MakeImgData("icon:general," + (5 + i), 0, 16, CLR_DEFAULT | COLOR_MENU).GetHBITMAP(-4);
}

if (!te.Data.ClipboardHistory) {
	te.Data.ClipboardHistory = api.CreateObject("Array");
}
