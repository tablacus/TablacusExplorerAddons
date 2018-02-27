Addon_Id = "totalfilesizesort";
Default = "ToolBar2Left";

var items = te.Data.Addons.getElementsByTagName(Addon_Id);
if (items.length) {
	var item = items[0];
	if (!item.getAttribute("Set")) {
	}
}
if (window.Addon == 1) {
	Addons.TotalFileSizeSort =
	{
		nPos: 0,
		strName: "",
		cue: {},

		Exec: function (Ctrl, pt)
		{
			var FV = GetFolderView(Ctrl, pt);
			if (FV) {
				Addons.TotalFileSizeSort.Exec2(FV, FV.FolderItem);
			}
			return S_OK;
		},

		Exec2: function (FV, FolderItem)
		{
			delete Addons.TotalFileSizeSort.cue[FV.Id];
			if (!api.ILIsEqual(FV.FolderItem, FolderItem)) {
				return S_OK;
			}
			var col = FV.Columns(1);
			if (!col) {
				return S_OK;
			}
			var Items = FV.Items();
			var List = [];
			var wfd = api.Memory("WIN32_FIND_DATA");
			var bYet = false;
			for (var i = Items.Count; i--;) {
				api.SHGetDataFromIDList(Items.Item(i), SHGDFIL_FINDDATA, wfd, wfd.Size);
				if (wfd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) {
					var n = FV.TotalFileSize[wfd.cFileName];
					if (n === undefined) {
						FV.Notify(0, Items.Item(i), null, 1);
						bYet = true;
					} else if (n === "") {
						bYet = true;
					}
				}
			}
			if (bYet) {
				if (FV.hwndList) {
					Addons.TotalFileSizeSort.cue[FV.Id] = FolderItem;
				}
				return S_OK;
			}
			for (var i = Items.Count; i--;) {
				api.SHGetDataFromIDList(Items.Item(i), SHGDFIL_FINDDATA, wfd, wfd.Size);
				var n = wfd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY ? FV.TotalFileSize[wfd.cFileName] : Items.Item(i).ExtendedProperty("Size");
				List.push([i, api.QuadPart(n)]);
			}
			if (!List.length) {
				return S_OK;
			}
			List.sort(function (a, b)
			{
				return api.UQuadCmp(a[1], b[1]);
			});
			FV.Parent.LockUpdate();
			try {
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
			}
			catch (e) {}
			(function (args) { setTimeout(function () {
				Addons.TotalFileSizeSort.Order(args);
			}, 99);}) (args);
		},

		Order: function (args)
		{
			try  {
				var pt = api.Memory("POINT");
				args.FV.GetItemPosition(args.Items.Item(0), pt);
				for (var i in args.List) {
					args.FV.SelectAndPositionItem(args.Items.Item(args.List[i][0]), 0, pt);
				}
				args.FV.CurrentViewMode = args.ViewMode;
				args.FV.FolderFlags = args.FolderFlags;
				te.Layout = te.Data.Conf_Layout;
			}
			catch (e) {}
			args.FV.Parent.UnlockUpdate(true);
		}
	};

	AddEvent("StatusText", function (Ctrl, Text, iPart)
	{
		for (var i in Addons.TotalFileSizeSort.cue) {
			Addons.TotalFileSizeSort.Exec2(te.Ctrl(CTRL_FV, i), Addons.TotalFileSizeSort.cue[i]);
		}
	});

	AddEvent("ColumnClick", function (Ctrl, iItem)
	{
		var cColumns = api.CommandLineToArgv(Ctrl.Columns(1));
		var s = cColumns[iItem * 2];
		if (s == "System.TotalFileSize" || (s == "System.Size" && api.GetKeyState(VK_SHIFT) < 0)) {
			(function (FV) { setTimeout(function () {
				Addons.TotalFileSizeSort.Exec(FV);
			}, 99);}) (Ctrl);
			return S_OK;
		}
	});

	if (item) {
		//Menu
		if (item.getAttribute("MenuExec")) {
			Addons.TotalFileSizeSort.nPos = api.LowPart(item.getAttribute("MenuPos"));
			var s = item.getAttribute("MenuName");
			if (s && s != "") {
				Addons.TotalFileSizeSort.strName = s;
			}
			AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
			{
				api.InsertMenu(hMenu, Addons.TotalFileSizeSort.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Addons.TotalFileSizeSort.strName));
				ExtraMenuCommand[nPos] = Addons.TotalFileSizeSort.Exec;
				return nPos;
			});
		}
		//Key
		if (item.getAttribute("KeyExec")) {
			SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.TotalFileSizeSort.Exec, "Func");
		}
		//Mouse
		if (item.getAttribute("MouseExec")) {
			SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.TotalFileSizeSort.Exec, "Func");
		}
		//Type
		AddTypeEx("Add-ons", "Total file size sort", Addons.TotalFileSizeSort.Exec);
	}

	if (Addons.TotalFileSizeSort.strName == "") {
		var info = GetAddonInfo(Addon_Id);
		Addons.TotalFileSizeSort.strName = GetText(info.Name);
	}
	var h = GetAddonOption(Addon_Id, "IconSize") || window.IconSize || 24;
	var src = GetAddonOption(Addon_Id, "Icon") || (h <= 16 ? "bitmap:ieframe.dll,216,16,25" : "bitmap:ieframe.dll,214,24,25");

	var s = ['<span class="button" onclick="return Addons.TotalFileSizeSort.Exec(this);" oncontextmenu="return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()"><img title="', Addons.TotalFileSizeSort.strName.replace(/"/g, ""), '" src="', src.replace(/"/g, ""), '" width="', h, 'px" height="' + h, 'px"></span>'];
	SetAddon(Addon_Id, Default, s);
}
else {
	EnableInner();
}
