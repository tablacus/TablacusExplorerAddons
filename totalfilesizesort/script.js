var Addon_Id = "totalfilesizesort";
var Default = "ToolBar2Left";

var item = GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.TotalFileSizeSort =
	{
		strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
		nPos: api.LowPart(item.getAttribute("MenuPos")),
		cue: {},

		Exec: function (Ctrl, pt)
		{
			var FV = GetFolderView(Ctrl, pt);
			if (FV) {
				FV.Focus();
				FV.SortColumn = "-Tablacus.TotalFileSize";
				return S_OK;
			}
		},

		DoSort: function (FV, ar)
		{
			delete Addons.TotalFileSizeSort.cue[FV.Id];
			if (!api.ILIsEqual(FV.FolderItem, ar[0])) {
				return S_OK;
			}
			var col = FV.Columns(1);
			if (!col) {
				return S_OK;
			}
			if (!/"System\.TotalFileSize"/i.test(col)) {
				FV.Columns = col + ' "System.TotalFileSize" -1';
			}
			var Items = FV.Items();
			var wfd = api.Memory("WIN32_FIND_DATA");
			var bYet = false;
			for (var i = Items.Count; i--;) {
				api.SHGetDataFromIDList(Items.Item(i), SHGDFIL_FINDDATA, wfd, wfd.Size);
				if (wfd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) {
					var n = FV.TotalFileSize[api.GetDisplayNameOf(Items.Item(i), SHGDN_FORPARSING | SHGDN_ORIGINAL)];
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
					Addons.TotalFileSizeSort.cue[FV.Id] = ar;
				}
				return S_OK;
			}
			CustomSort(FV, "System.TotalFileSize", ar[1],
				function (pid, FV)
				{
					var wfd = api.Memory("WIN32_FIND_DATA");
					api.SHGetDataFromIDList(pid, SHGDFIL_FINDDATA, wfd, wfd.Size);
					return wfd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY ? FV.TotalFileSize[api.GetDisplayNameOf(pid, SHGDN_FORPARSING | SHGDN_ORIGINAL)] : pid.ExtendedProperty("Size");
				},
				function (a, b)
				{
					return api.UQuadCmp(b[1], a[1]);
				}
			);
		}
	};

	AddEvent("StatusText", function (Ctrl, Text, iPart)
	{
		for (var i in Addons.TotalFileSizeSort.cue) {
			Addons.TotalFileSizeSort.DoSort(te.Ctrl(CTRL_FV, i), Addons.TotalFileSizeSort.cue[i]);
		}
	});

	AddEvent("ColumnClick", function (Ctrl, iItem)
	{
		var cColumns = api.CommandLineToArgv(Ctrl.Columns(1));
		var s = cColumns[iItem * 2];
		if (s == "System.TotalFileSize" || (s == "System.Size" && api.GetKeyState(VK_SHIFT) < 0)) {
			Ctrl.SortColumn = (Ctrl.SortColumn != '-System.TotalFileSize') ? '-System.TotalFileSize' : 'System.TotalFileSize';
			return S_OK;
		}
	});

	AddEvent("Sort", function (Ctrl)
	{
		var res = /^prop:(\-?System\.TotalFileSize);$/.exec(Ctrl.SortColumns);
		if (res) {
			setTimeout(function ()
			{
				Ctrl.SortColumn = res[1];
			}, 99);
		}
	});

	AddEvent("Sorting", function (Ctrl, Name)
	{
		if (/-?[Tablacus|System]\.TotalFileSize$/i.test(Name)) {
			Addons.TotalFileSizeSort.DoSort(Ctrl, [Ctrl.FolderItem, /^-/.test(Name)]);
			return true;
		}
	});

	//Menu
	if (item.getAttribute("MenuExec")) {
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

	var h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	var src = item.getAttribute("Icon") || (h <= 16 ? "bitmap:ieframe.dll,216,16,25" : "bitmap:ieframe.dll,214,24,25");
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="return Addons.TotalFileSizeSort.Exec(this);" oncontextmenu="return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', GetImgTag({ title: Addons.TotalFileSizeSort.strName, src: src }, h), '</span>']);
} else {
	EnableInner();
}
