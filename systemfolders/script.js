var Addon_Id = "systemfolders";
var Default = "ToolBar2Left";

var item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuPos", -1);
}

if (window.Addon == 1) {
	Addons.SystemFolders =
	{
		nPos: 0, dir: [], Flat: api.LowPart(item.getAttribute("Flat")),

		Exec: function (Ctrl, pt)
		{
			setTimeout(function () {
				var hMenu = Addons.SystemFolders.GetMenu(api.CreatePopupMenu(), 1);
				var pt = GetPos(Ctrl, true, false, false, true);
				if (Ctrl.Type) {
					api.GetCursorPos(pt);
				}
				var nVerb = api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null);
				api.DestroyMenu(hMenu);
				if (nVerb) {
					Navigate(Addons.SystemFolders.dir[nVerb - 1], SBSP_NEWBROWSER);
				}
			}, 99);
			return S_OK;
		},

		GetMenu: function (hMenu, nOffset)
		{
			var dir = Addons.SystemFolders.dir;
			if (!dir.length) {
				dir.push(ssfDRIVES, ssfNETHOOD, ssfWINDOWS, ssfSYSTEM, ssfPROGRAMFILES);
				if (api.sizeof("HANDLE") > 4) {
					dir.push(ssfPROGRAMFILESx86);
				} else if (api.IsWow64Process(api.GetCurrentProcess())) {
					dir.push(api.GetDisplayNameOf(ssfPROGRAMFILES, SHGDN_FORPARSING).replace(/\s*\(x86\)$/i, ""));
				}
				dir.push(ssfCOMMONAPPDATA, fso.GetSpecialFolder(2).Path, "shell:libraries", ssfPERSONAL, "shell:downloads", ssfSTARTMENU, ssfPROGRAMS, ssfSTARTUP, ssfSENDTO, ssfLOCALAPPDATA, ssfAPPDATA, ssfFAVORITES, ssfRECENT, ssfHISTORY, ssfDESKTOPDIRECTORY, ssfCONTROLS, ssfTEMPLATES, ssfFONTS, ssfPRINTERS, ssfBITBUCKET);
				for (var i = dir.length; i--;) {
					try {
						dir[i] = sha.NameSpace(dir[i]);
						if (!dir[i]) {
							throw 1;
						}
					} catch (e) {
						dir.splice(i, 1);
					}
				}
			}
			var mii = api.Memory("MENUITEMINFO");
			mii.cbSize = mii.Size;
			mii.fMask  = MIIM_ID | MIIM_STRING | MIIM_BITMAP;
			for (var i = 0; i < dir.length; i++) {
				mii.wID = i + nOffset;
				mii.dwTypeData = api.GetDisplayNameOf(dir[i], SHGDN_INFOLDER);
				AddMenuIconFolderItem(mii, dir[i]);
				api.InsertMenuItem(hMenu, 0, false, mii);
			}
			return hMenu;
		},

		MenuCommand: function (Ctrl, pt, Name, nVerb, hMenu)
		{
			nVerb -= Addons.SystemFolders.nCommand;
			if (nVerb >= 0 && nVerb < Addons.SystemFolders.dir.length) {
				Navigate(Addons.SystemFolders.dir[nVerb], SBSP_NEWBROWSER);
				return S_OK;
			}
		}
	};

	//Menu
	var s = item.getAttribute("MenuName");
	if (!s || s == "") {
		var info = GetAddonInfo(Addon_Id);
		s = info.Name;
	}
	Addons.SystemFolders.strName = s;
	if (item.getAttribute("MenuExec")) {
		Addons.SystemFolders.nPos = api.LowPart(item.getAttribute("MenuPos"));
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
		{
			Addons.SystemFolders.nCommand = nPos + 1;
			if (Addons.SystemFolders.Flat) {
				Addons.SystemFolders.GetMenu(hMenu, nPos + 1)
			} else {
				var mii = api.Memory("MENUITEMINFO");
				mii.cbSize = mii.Size;
				mii.fMask = MIIM_STRING | MIIM_SUBMENU;
				mii.dwTypeData = Addons.SystemFolders.strName;
				mii.hSubMenu = Addons.SystemFolders.GetMenu(api.CreatePopupMenu(), nPos + 1);
				api.InsertMenuItem(hMenu, Addons.SystemFolders.nPos, true, mii);
			}
			AddEvent("MenuCommand", Addons.SystemFolders.MenuCommand);
			nPos += Addons.SystemFolders.dir.length;
			return nPos;
		});
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.SystemFolders.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.SystemFolders.Exec, "Func");
	}
	AddTypeEx("Add-ons", "System folders", Addons.SystemFolders.Exec);

	var h = item.getAttribute("IconSize") || window.IconSize || (item.getAttribute("Location") == "Inner" ? 16 : 24);
	var src = item.getAttribute("Icon") || (h <= 16 ? "icon:shell32.dll,42,16" : "icon:shell32.dll,42,32");
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.SystemFolders.Exec(this)" oncontextmenu="Addons.SystemFolders.Exec(this); return false" onmouseover="MouseOver(this)" onmouseout="MouseOut()"><img title="', Addons.SystemFolders.strName.replace(/"/g, "&quot;"), '" src="', src.replace(/"/g, ""), '" width="', h, 'px" height="', h, 'px"></span>']);
} else {
	EnableInner();
	document.getElementById("panel7").innerHTML += '<div><input type="checkbox" name="Flat"><label>Flat</label></div>';
}
