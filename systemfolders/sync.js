const Addon_Id = "systemfolders";
const item = GetAddonElement(Addon_Id);

Sync.SystemFolders = {
	dir: [],
	Flat: GetNum(item.getAttribute("Flat")),
	wFlags: GetNum(item.getAttribute("NoNewTab")) ? SBSP_SAMEBROWSER : SBSP_NEWBROWSER,
	strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
	nPos: GetNum(item.getAttribute("MenuPos")),

	Exec: function (Ctrl, pt) {
		Sync.SystemFolders.ExecMenu(Ctrl, pt, function (pid, FV) {
			FolderMenu.Invoke(pid, Sync.SystemFolders.wFlags | GetNavigateFlags(FV), FV);
		});
		return S_OK;
	},

	Popup: function (Ctrl, pt) {
		Sync.SystemFolders.ExecMenu(Ctrl, pt, function (pid) {
			PopupContextMenu(pid);
		});
		return S_OK;
	},

	ExecMenu: function (Ctrl, pt, fn) {
		const FV = GetFolderView(Ctrl, pt);
		FV.Focus();
		const hMenu = Sync.SystemFolders.GetMenu(api.CreatePopupMenu(), 1);
		if (!pt) {
			pt = api.Memory("POINT");
			api.GetCursorPos(pt);
		}
		const nVerb = FolderMenu.TrackPopupMenu(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y);
		api.DestroyMenu(hMenu);
		if (nVerb) {
			fn(Sync.SystemFolders.dir[nVerb - 1], FV);
		}
	},

	GetMenu: function (hMenu, nOffset) {
		const dir = Sync.SystemFolders.dir;
		if (!dir.length) {
			dir.push(ssfDRIVES, ssfNETHOOD, ssfWINDOWS, ssfSYSTEM, ssfPROGRAMFILES);
			if (g_.bit > 32) {
				dir.push(ssfPROGRAMFILESx86);
			} else if (api.IsWow64Process(api.GetCurrentProcess())) {
				dir.push(api.GetDisplayNameOf(ssfPROGRAMFILES, SHGDN_FORPARSING).replace(/\s*\(x86\)$/i, ""));
			}
			dir.push(ssfCOMMONAPPDATA, GetTempPath(), "shell:libraries", ssfPERSONAL, "shell:downloads", ssfSTARTMENU, ssfPROGRAMS, ssfSTARTUP, ssfSENDTO, ssfLOCALAPPDATA, ssfAPPDATA, ssfFAVORITES, ssfRECENT, ssfHISTORY, ssfDESKTOP, ssfCONTROLS, "shell:Common Administrative Tools", ssfTEMPLATES, ssfFONTS, ssfPRINTERS, ssfBITBUCKET);
			for (let i = dir.length; i--;) {
				dir[i] = api.ILCreateFromPath(dir[i]);
				if (!dir[i].IsFolder || dir[i].Unavailable) {
					dir.splice(i, 1);
				}
			}
		}
		const mii = api.Memory("MENUITEMINFO");
		mii.fMask = MIIM_ID | MIIM_STRING | MIIM_BITMAP;
		for (let i = 0; i < dir.length; i++) {
			mii.wID = i + nOffset;
			mii.dwTypeData = dir[i].Name;
			AddMenuIconFolderItem(mii, dir[i]);
			api.InsertMenuItem(hMenu, 0, false, mii);
		}
		return hMenu;
	},

	MenuCommand: function (Ctrl, pt, Name, nVerb, hMenu) {
		nVerb -= Sync.SystemFolders.nCommand;
		if (nVerb >= 0 && nVerb < Sync.SystemFolders.dir.length) {
			Navigate(Sync.SystemFolders.dir[nVerb], SBSP_NEWBROWSER);
			return S_OK;
		}
	}
};

//Menu
if (item.getAttribute("MenuExec")) {
	AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos) {
		Sync.SystemFolders.nCommand = nPos + 1;
		if (Sync.SystemFolders.Flat) {
			Sync.SystemFolders.GetMenu(hMenu, nPos + 1)
		} else {
			const mii = api.Memory("MENUITEMINFO");
			mii.fMask = MIIM_STRING | MIIM_SUBMENU;
			mii.dwTypeData = Sync.SystemFolders.strName;
			mii.hSubMenu = Sync.SystemFolders.GetMenu(api.CreatePopupMenu(), nPos + 1);
			api.InsertMenuItem(hMenu, Sync.SystemFolders.nPos, true, mii);
		}
		AddEvent("MenuCommand", Sync.SystemFolders.MenuCommand);
		nPos += Sync.SystemFolders.dir.length;
		return nPos;
	});
}
//Key
if (item.getAttribute("KeyExec")) {
	SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Sync.SystemFolders.Exec, "Func");
}
//Mouse
if (item.getAttribute("MouseExec")) {
	SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Sync.SystemFolders.Exec, "Func");
}
AddTypeEx("Add-ons", "System folders", Sync.SystemFolders.Exec);
