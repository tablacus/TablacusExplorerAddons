var Addon_Id = "mixedsort";
var Default = "ToolBar2Left";

var item = GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.MixedSort =
	{
		nPos: 0,
		strName: "",

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
			var hMenu = api.CreatePopupMenu();
			Addons.MixedSort.CreateMenu(hMenu, 1);
			var pt = api.Memory("POINT");
			api.GetCursorPos(pt);
			var nVerb = api.TrackPopupMenuEx(hMenu, TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null);
			if (nVerb) {
				ExtraMenuCommand[nVerb](Ctrl, pt);
			}
		},

		CalcSort: function (Ctrl, pt, strProp)
		{
			var FV = GetFolderView(Ctrl, pt);
			if (!FV) {
				return S_OK;
			}
			var Items = FV.Items();
			var n, List = [], r = false;
			strProp = strProp.replace(/Tablacus\./i, "");
			var res = /^-(.*)/.exec(strProp);
			if (res) {
				r = true;
				strProp = res[1];
			}
			for (var i = Items.Count; i--;) {
				List.push([i, Items.Item(i).ExtendedProperty(strProp)]);
			}
			var fn;
			if (/Name/i.test(strProp)) {
				fn = function (a, b)
				{
					return api.StrCmpLogical(b[1], a[1]);
				}
			} else {
				fn = function (a, b)
				{
					return (b[1] - a[1]);
				}
			}
			List.sort(fn);
			if (r) {
				List = List.reverse();
			}
			FV.Parent.LockUpdate();
			try {
				var ViewMode = api.SendMessage(FV.hwndList, LVM_GETVIEW, 0, 0);
				if (ViewMode == 1 || ViewMode == 3) {
					api.SendMessage(FV.hwndList, LVM_SETVIEW, 4, 0);
				}
				var FolderFlags = FV.FolderFlags;
				FV.FolderFlags = FolderFlags | FWF_AUTOARRANGE;
				FV.GroupBy = "System.Null";
				var pt = api.Memory("POINT");
				FV.GetItemPosition(Items.Item(0), pt);
				for (var i in List) {
					FV.SelectAndPositionItem(Items.Item(List[i][0]), 0, pt);
				}
				api.SendMessage(FV.hwndList, LVM_SETVIEW, ViewMode, 0);
				FV.FolderFlags = FolderFlags;
			} catch (e) {}
			FV.Parent.UnlockUpdate(true);
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
			Addons.MixedSort.CalcSort(Ctrl, null, Name);
			return true;
		}
	});

	if (item) {
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
	}

	if (Addons.MixedSort.strName == "") {
		var info = GetAddonInfo(Addon_Id);
		Addons.MixedSort.strName = GetText(info.Name);
	}
	var h = GetAddonOption(Addon_Id, "IconSize") || window.IconSize || 24;
	var src = GetAddonOption(Addon_Id, "Icon") || (h <= 16 ? "bitmap:ieframe.dll,216,16,24" : "bitmap:ieframe.dll,214,24,24");

	var s = ['<span class="button" onclick="return Addons.MixedSort.Exec(this);" oncontextmenu="return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()"><img title="', Addons.MixedSort.strName.replace(/"/g, ""), '" src="', src.replace(/"/g, ""), '" width="', h, 'px" height="' + h, 'px"></span>'];
	SetAddon(Addon_Id, Default, s);
}
