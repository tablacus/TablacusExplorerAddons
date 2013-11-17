if (window.Addon == 1) {

	Addons.QuickMenu =
	{
		Items: null,
		SendTo: function (hMenu)
		{
			hMenu = api.sscanf(hMenu, "%llx");
			var wID = 0x6000;
			var fol = sha.NameSpace(api.GetDisplayNameOf(ssfSENDTO, SHGDN_FORPARSING));
			Addons.QuickMenu.Items = fol.Items();
			for (var i = 0; i < Addons.QuickMenu.Items.Count; i++) {
				ExtraMenuCommand[wID] = function (Ctrl, pt, Name, nVerb)
				{
					var DropTarget = api.DropTarget(Addons.QuickMenu.Items.Item(nVerb - 0x6000));
					pdwEffect = api.Memory("DWORD");
					pdwEffect[0] = DROPEFFECT_COPY | DROPEFFECT_MOVE | DROPEFFECT_LINK;
					var Selected = Ctrl.SelectedItems();
					if (Selected) {
						DropTarget.Drop(Selected, MK_LBUTTON, pt, pdwEffect);
					}
				};
				api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, wID++, api.GetDisplayNameOf(Addons.QuickMenu.Items.Item(i), SHGDN_INFOLDER));
			}
		}
	}

	AddEvent("GetBaseMenu", function (nBase, FV, Selected, uCMF, Mode)
	{
		var hMenu;
		var nPos = 0;
		if (Mode & 0x10) {
			return;
		}
		switch (nBase) {
			case 2:
				hMenu = te.MainMenu(FCIDM_MENU_FILE);
				var hModule = api.LoadLibraryEx(fso.BuildPath(system32, "shell32.dll"), 0, LOAD_LIBRARY_AS_DATAFILE);
				var hMenu1 = api.LoadMenu(hModule, 233);
				var hMenu2 = api.GetSubMenu(hMenu1, 0);

				var mii = api.Memory("MENUITEMINFO");
				mii.cbSize = mii.Size;
				mii.fMask = MIIM_STRING | MIIM_STATE | MIIM_ID;
				mii.fState = MFS_DEFAULT;
				mii.wID = nPos + 0x1000;
				mii.dwTypeData = api.GetMenuString(hMenu2, 0, MF_BYPOSITION);
				ExtraMenuCommand[mii.wID] = function (Ctrl, pt, Name, nVerb)
				{
					if (ExecMenu(Ctrl, "Default", pt, 2) != S_OK) {
						InvokeCommand(Ctrl.SelectedItems(), 0, te.hwnd, null, null, null, SW_SHOWNORMAL, 0, 0);
					}
				};
				api.InsertMenuItem(hMenu, nPos++, true, mii);
				api.DestroyMenu(hMenu2);
				api.DestroyMenu(hMenu1);

				mii.wID = nPos + 0x1000;
				ExtraMenuCommand[mii.wID] = function (Ctrl, pt, Name, nVerb)
				{
					InvokeCommand(Ctrl.SelectedItems(), 0, te.hwnd, "Edit", null, null, SW_SHOWNORMAL, 0, 0);
				};
				api.InsertMenu(hMenu, nPos++, MF_BYPOSITION | MF_STRING, mii.wID, GetText("Edit"));

				mii.wID = nPos + 0x1000;
				ExtraMenuCommand[mii.wID] = function (Ctrl, pt, Name, nVerb)
				{
					ExecMenu(Ctrl, Name, pt, 0x10);
				};
				api.InsertMenu(hMenu, nPos++, MF_BYPOSITION | MF_STRING, mii.wID, GetText("Default"));

				hMenu1 = api.LoadMenu(hModule, 223);
				hMenu2 = api.GetSubMenu(hMenu1, 0);
				api.InsertMenu(hMenu, nPos++, MF_BYPOSITION | MF_SEPARATOR, 0, null);
				mii.fMask  = MIIM_ID | MIIM_STRING | MIIM_SUBMENU;
				mii.wID = nPos + 0x1000;
				mii.dwTypeData = api.GetMenuString(hMenu2, 0, MF_BYPOSITION);
				mii.hSubMenu = api.CreatePopupMenu();
				api.InsertMenu(mii.hSubMenu, 0, MF_BYPOSITION | MF_STRING, 0, api.sprintf(100, '\tJScript\tAddons.QuickMenu.SendTo("%llx")', mii.hSubMenu));
				api.InsertMenuItem(hMenu, nPos++, true, mii);
				api.InsertMenu(hMenu, nPos++, MF_BYPOSITION | MF_SEPARATOR, 0, null);
				api.DestroyMenu(hMenu2);
				api.DestroyMenu(hMenu1);

				hMenu1 = api.LoadMenu(hModule, 210);
				hMenu2 = api.GetSubMenu(hMenu1, 0);

				mii.wID = nPos + 0x1000;
				api.InsertMenu(hMenu, nPos++, MF_BYPOSITION | MF_STRING, mii.wID, api.GetMenuString(hMenu2, 0, MF_BYPOSITION));
				ExtraMenuCommand[mii.wID] = function (Ctrl, pt, Name, nVerb)
				{
					InvokeCommand(Ctrl.SelectedItems(), 0, te.hwnd, "Cut", null, null, SW_SHOWNORMAL, 0, 0);
				};

				mii.wID = nPos + 0x1000;
				api.InsertMenu(hMenu, nPos++, MF_BYPOSITION | MF_STRING, mii.wID, api.GetMenuString(hMenu2, 1, MF_BYPOSITION));
				ExtraMenuCommand[mii.wID] = function (Ctrl, pt, Name, nVerb)
				{
					InvokeCommand(Ctrl.SelectedItems(), 0, te.hwnd, "Copy", null, null, SW_SHOWNORMAL, 0, 0);
				};

				mii.wID = nPos + 0x1000;
				api.InsertMenu(hMenu, nPos++, MF_BYPOSITION | MF_STRING, mii.wID, api.GetMenuString(hMenu2, 2, MF_BYPOSITION));
				ExtraMenuCommand[mii.wID] = function (Ctrl, pt, Name, nVerb)
				{
					var Items = Ctrl.SelectedItems();
					if (Items.Count == 1 && Items.Item(0).IsFolder) {
					}
					else {
						Items = Ctrl;
					}
					InvokeCommand(Items, 0, te.hwnd, "Paste", null, null, SW_SHOWNORMAL, 0, 0);
				};
				api.DestroyMenu(hMenu2);
				api.DestroyMenu(hMenu1);
				api.FreeLibrary(hModule);

				api.InsertMenu(hMenu, nPos++, MF_BYPOSITION | MF_SEPARATOR, 0, null);
				return [hMenu];
			case 4:
				hMenu = te.MainMenu(FCIDM_MENU_FILE);
				var wID = nPos + 0x1000;
				ExtraMenuCommand[wID] = function (Ctrl, pt, Name, nVerb)
				{
					ExecMenu(Ctrl, Name, pt, 0x10);
				};
				api.InsertMenu(hMenu, nPos++, MF_BYPOSITION | MF_STRING, wID, GetText("Default"));
				return [hMenu];
			case 5:
				hMenu = te.MainMenu(FCIDM_MENU_EDIT);
				var wID = nPos + 0x1000;
				ExtraMenuCommand[wID] = function (Ctrl, pt, Name, nVerb)
				{
					ExecMenu(Ctrl, Name, pt, 0x10);
				};
				api.InsertMenu(hMenu, nPos++, MF_BYPOSITION | MF_STRING, wID, GetText("Default"));
				return [hMenu];
			case 6:
				hMenu = te.MainMenu(FCIDM_MENU_VIEW);
				var wID = nPos + 0x1000;
				ExtraMenuCommand[wID] = function (Ctrl, pt, Name, nVerb)
				{
					ExecMenu(Ctrl, Name, pt, 0x10);
				};
				api.InsertMenu(hMenu, nPos++, MF_BYPOSITION | MF_STRING, wID, GetText("Default"));
				return [hMenu];
		}
	});
}

