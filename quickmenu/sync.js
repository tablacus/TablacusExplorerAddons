Sync.QuickMenu = {
	Items: null,
	SendTo: function (hMenu) {
		hMenu = api.sscanf(hMenu, "%llx");
		Sync.QuickMenu.Items = sha.NameSpace(ssfSENDTO).Items();
		for (let i = 0; i < Sync.QuickMenu.Items.Count; i++) {
			api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, 0x4e00 + i, api.GetDisplayNameOf(Sync.QuickMenu.Items.Item(i), SHGDN_INFOLDER));
		}
		api.DeleteMenu(hMenu, -2, MF_BYCOMMAND);
		AddEvent("MenuCommand", function (Ctrl, pt, Name, nVerb) {
			nVerb -= 0x4e00;
			if (nVerb >= 0 && nVerb < Sync.QuickMenu.Items.Count) {
				const DropTarget = api.DropTarget(Sync.QuickMenu.Items.Item(nVerb));
				const pdwEffect = [DROPEFFECT_COPY | DROPEFFECT_MOVE | DROPEFFECT_LINK];
				const Selected = Ctrl.SelectedItems();
				if (Selected) {
					DropTarget.Drop(Selected, MK_LBUTTON, pt, pdwEffect);
				}
				return S_OK;
			}
		});
	},

	SetDefault: function (hMenu, wID) {
		ExtraMenuCommand[wID] = function (Ctrl, pt, Name, nVerb) {
			ExecMenu(Ctrl, Name, pt, 0x8000);
		};
		api.SetMenuDefaultItem(hMenu, -1, true);
		api.InsertMenu(hMenu, 0, MF_BYPOSITION | MF_STRING, wID++, GetText("Default"));
	},

	HasSystemFolder: function (Items) {
		let i = Items.Count;
		if (i) {
			while (--i >= 0) {
				if (!/^[A-Z]:\\|^\\\\\w/i.test(Items.Item(i).Path)) {
					return true;
				}
			}
			return;
		}
		return !/^[A-Z]:\\|^\\\\\w/i.test(Items.Path);
	}
}

AddEvent("GetBaseMenuEx", function (hMenu, nBase, FV, Selected, uCMF, Mode, SelItem, arContextMenu) {
	if ((Mode & 0x8000) || api.GetKeyState(VK_SHIFT) < 0) {
		return;
	}
	let nPos = 0;
	let wID = 0x4c00;
	let ContextMenu;
	switch (nBase) {
		case 2:
			let Items = Selected;
			if (!Items || !Items.Count) {
				Items = SelItem;
			}
			if (Sync.QuickMenu.HasSystemFolder(Items)) {
				return;
			}
			ContextMenu = arContextMenu && arContextMenu[1] || api.ContextMenu(Items, FV);
			if (ContextMenu) {
				if (arContextMenu) {
					arContextMenu[1] = ContextMenu;
				}
				ContextMenu.QueryContextMenu(hMenu, 0, 0x6001, 0x6fff, CMF_DEFAULTONLY | CMF_CANRENAME | CMF_ITEMMENU);
				const mii = api.Memory("MENUITEMINFO");
				mii.cbSize = mii.Size;
				mii.fMask = MIIM_FTYPE;
				while (api.GetMenuItemInfo(hMenu, nPos++, true, mii) && !(mii.fType & MFT_SEPARATOR)) {
				}
				const hMenu1 = api.LoadMenu(hShell32, 223);
				mii.fMask = MIIM_ID | MIIM_STRING | MIIM_SUBMENU;
				mii.wID = wID++;
				mii.dwTypeData = api.GetMenuString(api.GetSubMenu(hMenu1, 0), 0, MF_BYPOSITION);
				mii.hSubMenu = api.CreatePopupMenu();
				api.InsertMenu(mii.hSubMenu, 0, MF_BYPOSITION | MF_STRING, 0, api.sprintf(99, '\tJScript\tSync.QuickMenu.SendTo("%llx")', mii.hSubMenu));
				api.InsertMenuItem(hMenu, nPos++, true, mii);
				api.InsertMenu(hMenu, nPos++, MF_BYPOSITION | MF_SEPARATOR, 0, null);
				api.DestroyMenu(hMenu1);
			}
			Sync.QuickMenu.SetDefault(hMenu, wID);
			return ContextMenu;
		case 3:
			if (FV) {
				if (!SameText(api.GetClassName(FV), "{F3364BA0-65B9-11CE-A9BA-00AA004AE837}")) {
					return;
				}
				ContextMenu = GetViewMenu(arContextMenu, FV, hMenu, CMF_DEFAULTONLY);
				Sync.QuickMenu.SetDefault(hMenu, wID);
			}
			return ContextMenu;
		case 4:
			Items = Selected;
			if (!Items || !Items.Count) {
				Items = SelItem;
			}
			if (Items && Items.Count) {
				if (Sync.QuickMenu.HasSystemFolder(Items)) {
					return;
				}
				ContextMenu = arContextMenu && arContextMenu[1] || api.ContextMenu(Items, FV);
				if (ContextMenu) {
					if (arContextMenu) {
						arContextMenu[1] = ContextMenu;
					}
					ContextMenu.QueryContextMenu(hMenu, 0, 0x6001, 0x6fff, CMF_DEFAULTONLY | CMF_CANRENAME);
				}
			} else if (FV) {
				if (!SameText(api.GetClassName(FV), "{F3364BA0-65B9-11CE-A9BA-00AA004AE837}")) {
					return;
				}
				ContextMenu = GetViewMenu(arContextMenu, FV, hMenu, CMF_DEFAULTONLY);
				api.SetMenuDefaultItem(hMenu, -1, true);
				const mii = api.Memory("MENUITEMINFO");
				mii.cbSize = mii.Size;
				mii.fMask = MIIM_FTYPE | MIIM_SUBMENU;
				for (let i = api.GetMenuItemCount(hMenu); i--;) {
					api.GetMenuItemInfo(hMenu, 0, true, mii);
					if (mii.hSubMenu || (mii.fType & MFT_SEPARATOR)) {
						api.DeleteMenu(hMenu, 0, MF_BYPOSITION);
						continue;
					}
					break;
				}
			}
			Sync.QuickMenu.SetDefault(hMenu, wID);
			return ContextMenu;
	}
});
