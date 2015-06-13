Addon_Id = "mixedsort";
Default = "ToolBar2Left";

var items = te.Data.Addons.getElementsByTagName(Addon_Id);
if (items.length) {
	var item = items[0];
	if (!item.getAttribute("Set")) {
	}
}
if (window.Addon == 1) {
	Addons.MixedSort =
	{
		nPos: 0,
		strName: "",

		CreateMenu: function (hMenu, nIndex)
		{
			api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, ++nIndex, api.PSGetDisplayName("Name"));
			ExtraMenuCommand[nIndex] = function ()
			{
				Addons.MixedSort.CalcSort(Ctrl, pt, 0);
			};
			api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, ++nIndex, api.PSGetDisplayName("Write"));
			ExtraMenuCommand[nIndex] = function ()
			{
				Addons.MixedSort.CalcSort(Ctrl, pt, 1);
			};
			api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, ++nIndex, GetText("Reverse order"));
			ExtraMenuCommand[nIndex] = function ()
			{
				Addons.MixedSort.CalcSort(Ctrl, pt, -1);
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

		CalcSort: function (Ctrl, pt, nCol)
		{
			var FV = GetFolderView(Ctrl, pt);
			if (!FV) {
				return S_OK;
			}
			var Items = FV.Items();
			var List = [];
			var ar = ["Name", "Write"];
			var n, strProp = ar[nCol];
			for (var i = Items.Count; i--;) {
				List.push([i, Items.Item(i).ExtendedProperty(strProp)]);
			}
			var fn;
			if (nCol >= 0) {
				if (nCol == 0) {
					fn = function (a, b)
					{
						return api.StrCmpLogical(b[1], a[1]);
					}
				}
				else {
					fn = function (a, b)
					{
						return a[1] - b[1];
					}
				}
				List.sort(fn);
			}
			else {
				List = List.reverse();
			}
			var args = { FV: FV, Items: Items, List: List};
			args.ViewMode = FV.CurrentViewMode;
			if (args.ViewMode == FVM_DETAILS || args.ViewMode == FVM_LIST) {
				FV.CurrentViewMode = FVM_TILE;
			}
			args.FolderFlags = FV.FolderFlags;
			FV.FolderFlags = args.FolderFlags | FWF_AUTOARRANGE;
			FV.GroupBy = "System.Null";
			var f = ((2 ^ FV.CurrentViewMode) | (2 ^ args.ViewMode)) * 2;
			if (te.Layout & f) {
				te.Layout &= ~f;
				FV.Suspend();
			}
			(function (args) { setTimeout(function () {
				Addons.MixedSort.Order(args);
			}, 99);}) (args);
		},

		Order: function (args)
		{
			var pt = api.Memory("POINT");
			for (var i in args.List) {
				args.FV.SelectAndPositionItem(args.Items.Item(args.List[i][0]), 0, pt);
			}
			args.FV.CurrentViewMode = args.ViewMode;
			args.FV.FolderFlags = args.FolderFlags;
			te.Layout = te.Data.Conf_Layout;
		}
	};

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
