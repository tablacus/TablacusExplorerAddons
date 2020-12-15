const Addon_Id = "mixedsort";
const item = GetAddonElement(Addon_Id);

Sync.MixedSort = {
	strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
	nPos: GetNum(item.getAttribute("MenuPos")),

	CreateMenu: function (hMenu, nIndex) {
		api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, ++nIndex, api.PSGetDisplayName("Name"));
		ExtraMenuCommand[nIndex] = function (Ctrl, pt, Name, nVerb) {
			const FV = GetFolderView(Ctrl, pt);
			FV.SortColumn = 'Tablacus.Name';
		};
		api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, ++nIndex, '-' + api.PSGetDisplayName("Name"));
		ExtraMenuCommand[nIndex] = function (Ctrl, pt, Name, nVerb) {
			const FV = GetFolderView(Ctrl, pt);
			FV.SortColumn = '-Tablacus.Name';
		};
		api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, ++nIndex, api.PSGetDisplayName("Write"));
		ExtraMenuCommand[nIndex] = function (Ctrl, pt, Name, nVerb) {
			const FV = GetFolderView(Ctrl, pt);
			FV.SortColumn = 'Tablacus.Write';
		};
		api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, ++nIndex, '-' + api.PSGetDisplayName("Write"));
		ExtraMenuCommand[nIndex] = function (Ctrl, pt, Name, nVerb) {
			const FV = GetFolderView(Ctrl, pt);
			FV.SortColumn = '-Tablacus.Write';
		};
		return nIndex;
	},

	Exec: function (Ctrl, pt) {
		const FV = GetFolderView(Ctrl, pt);
		FV.Focus();
		ExtraMenuCommand = api.CreateObject("Object");
		const hMenu = api.CreatePopupMenu();
		Sync.MixedSort.CreateMenu(hMenu, 1);
		if (!pt) {
			pt = api.Memory("POINT");
			api.GetCursorPos(pt);
		}
		const nVerb = api.TrackPopupMenuEx(hMenu, TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null);
		if (nVerb) {
			ExtraMenuCommand[nVerb](Ctrl, pt);
		}
	},

	Sort: function (Ctrl, Name) {
		InvokeUI("Addons.MixedSort.ClearTimer", Ctrl.Id);
		if (/^\-?Tablacus\.Name$|^\-?Tablacus\.Write$/i.test(Name)) {
			let strProp = Name.replace(/Tablacus\./i, "");
			const res = /^\-(.*)/.exec(strProp);
			if (res) {
				strProp = res[1];
			}
			let fnAdd, fnComp;
			if (/Name/i.test(strProp)) {
				fnAdd = function (pid, FV) {
					return pid.ExtendedProperty("Name");
				};
				fnComp = function (a, b) {
					return api.StrCmpLogical(b[1], a[1]);
				};
			} else {
				fnAdd = function (pid, FV) {
					return pid.ExtendedProperty("Write");
				};
				fnComp = function (a, b) {
					return (b[1] - a[1]);
				};
			}
			CustomSort(Ctrl, strProp, res, fnAdd, fnComp);
			return true;
		}
	}
};

AddEvent("ColumnClick", function (Ctrl, iItem) {
	if (api.GetKeyState(VK_SHIFT) < 0) {
		const cColumns = api.CommandLineToArgv(Ctrl.Columns(1));
		const s = cColumns[iItem * 2];
		if (s == "System.ItemNameDisplay") {
			Ctrl.SortColumn = (Ctrl.SortColumn != 'Tablacus.Name') ? 'Tablacus.Name' : '-Tablacus.Name';
			return S_OK;
		}
		if (s == "System.DateModified") {
			Ctrl.SortColumn = (Ctrl.SortColumn != '-Tablacus.Write') ? '-Tablacus.Write' : 'Tablacus.Write';
			return S_OK;
		}
	}
});

AddEvent("Sorting", Sync.MixedSort.Sort);

//Menu
if (item.getAttribute("MenuExec")) {
	Sync.MixedSort.nPos = GetNum(item.getAttribute("MenuPos"));
	const s = item.getAttribute("MenuName");
	if (s) {
		Sync.MixedSort.strName = s;
	}
	AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos) {
		const mii = api.Memory("MENUITEMINFO");
		mii.cbSize = mii.Size;
		mii.fMask = MIIM_STRING | MIIM_SUBMENU;
		mii.hSubMenu = api.CreatePopupMenu();
		mii.dwTypeData = GetText(Sync.MixedSort.strName);
		nPos = Sync.MixedSort.CreateMenu(mii.hSubMenu, nPos);
		api.InsertMenuItem(hMenu, Sync.MixedSort.nPos, true, mii);
		return nPos;
	});
}
//Key
if (item.getAttribute("KeyExec")) {
	SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Sync.MixedSort.Exec, "Func");
}
//Mouse
if (item.getAttribute("MouseExec")) {
	SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Sync.MixedSort.Exec, "Func");
}
//Type
AddTypeEx("Add-ons", "Mixed sort", Sync.MixedSort.Exec);
