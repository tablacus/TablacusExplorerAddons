var Addon_Id = "mixedsort";
var Default = "ToolBar2Left";

var item = GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.MixedSort =
	{
		strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
		nPos: api.LowPart(item.getAttribute("MenuPos")),

		CreateMenu: function (hMenu, nIndex)
		{
			api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, ++nIndex, api.PSGetDisplayName("Name"));
			ExtraMenuCommand[nIndex] = function (Ctrl, pt, Name, nVerb)
			{
				var FV = GetFolderView(Ctrl, pt);
				FV.SortColumn = 'Tablacus.Name';
			};
			api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, ++nIndex, '-' + api.PSGetDisplayName("Name"));
			ExtraMenuCommand[nIndex] = function (Ctrl, pt, Name, nVerb)
			{
				var FV = GetFolderView(Ctrl, pt);
				FV.SortColumn = '-Tablacus.Name';
			};
			api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, ++nIndex, api.PSGetDisplayName("Write"));
			ExtraMenuCommand[nIndex] = function (Ctrl, pt, Name, nVerb)
			{
				var FV = GetFolderView(Ctrl, pt);
				FV.SortColumn = 'Tablacus.Write';
			};
			api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, ++nIndex, '-' + api.PSGetDisplayName("Write"));
			ExtraMenuCommand[nIndex] = function (Ctrl, pt, Name, nVerb)
			{
				var FV = GetFolderView(Ctrl, pt);
				FV.SortColumn = '-Tablacus.Write';
			};
			return nIndex;
		},

		Exec: function (Ctrl, pt)
		{
			var FV = GetFolderView(Ctrl, pt);
			FV.Focus();
			var hMenu = api.CreatePopupMenu();
			Addons.MixedSort.CreateMenu(hMenu, 1);
			var pt = api.Memory("POINT");
			api.GetCursorPos(pt);
			var nVerb = api.TrackPopupMenuEx(hMenu, TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null);
			if (nVerb) {
				ExtraMenuCommand[nVerb](Ctrl, pt);
			}
		}
	};

	AddEvent("ColumnClick", function (Ctrl, iItem)
	{
		if (api.GetKeyState(VK_SHIFT) < 0) {
			var cColumns = api.CommandLineToArgv(Ctrl.Columns(1));
			var s = cColumns[iItem * 2];
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

	AddEvent("Sorting", function (Ctrl, Name)
	{
		if (/-?Tablacus\.Name$|-?Tablacus\.Write$/i.test(Name)) {
			var strProp = Name.replace(/Tablacus\./i, "");
			var res = /^-(.*)/.exec(strProp);
			if (res) {
				strProp = res[1];
			}
			var fnAdd, fnComp;
			if (/Name/i.test(strProp)) {
				fnAdd = function (pid, FV)
				{
					return pid.ExtendedProperty("Name");
				};
				fnComp = function (a, b)
				{
					return api.StrCmpLogical(b[1], a[1]);
				};
			} else {
				fnAdd = function (pid, FV)
				{
					return pid.ExtendedProperty("Write");
				};
				fnComp = function (a, b)
				{
					return (b[1] - a[1]);
				};
			}
			CustomSort(Ctrl, strProp, res, fnAdd, fnComp);
			return true;
		}
	});

	//Menu
	if (item.getAttribute("MenuExec")) {
		Addons.MixedSort.nPos = api.LowPart(item.getAttribute("MenuPos"));
		var s = item.getAttribute("MenuName");
		if (s && s != "") {
			Addons.MixedSort.strName = s;
		}
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
		{
			var mii = api.Memory("MENUITEMINFO");
			mii.cbSize = mii.Size;
			mii.fMask = MIIM_STRING | MIIM_SUBMENU;
			mii.hSubMenu = api.CreatePopupMenu();
			mii.dwTypeData = GetText(Addons.MixedSort.strName);
			nPos = Addons.MixedSort.CreateMenu(mii.hSubMenu, nPos);
			api.InsertMenuItem(hMenu, Addons.MixedSort.nPos, true, mii);
			return nPos;
		});
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.MixedSort.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.MixedSort.Exec, "Func");
	}
	//Type
	AddTypeEx("Add-ons", "Mixed sort", Addons.MixedSort.Exec);

	var h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	var src = item.getAttribute("Icon") || (h <= 16 ? "bitmap:ieframe.dll,216,16,24" : "bitmap:ieframe.dll,214,24,24");
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="return Addons.MixedSort.Exec(this);" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', GetImgTag({ title: Addons.MixedSort.strName, src: src }, h), '</span>']);
} else {
	EnableInner();
}
