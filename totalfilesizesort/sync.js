const Addon_Id = "totalfilesizesort";
const item = GetAddonElement(Addon_Id);

Sync.TotalFileSizeSort = {
	strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
	nPos: GetNum(item.getAttribute("MenuPos")),
	cue: {},
	tid: {},

	Exec: function (Ctrl, pt) {
		const FV = GetFolderView(Ctrl, pt);
		if (FV) {
			FV.Focus();
			FV.SortColumn = "-Tablacus.TotalFileSize";
			return S_OK;
		}
	},

	DoSort: function (FV, ar) {
		delete Sync.TotalFileSizeSort.cue[FV.Id];
		if (!api.ILIsEqual(FV.FolderItem, ar[0])) {
			return S_OK;
		}
		const col = FV.Columns(1);
		if (!col) {
			return S_OK;
		}
		if (!/"System\.TotalFileSize"/i.test(col)) {
			FV.Columns = col + ' "System.TotalFileSize" -1';
		}
		const Items = FV.Items();
		const wfd = api.Memory("WIN32_FIND_DATA");
		let bYet = false;
		for (let i = Items.Count; i--;) {
			api.SHGetDataFromIDList(Items.Item(i), SHGDFIL_FINDDATA, wfd, wfd.Size);
			if (wfd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) {
				let n = FV.TotalFileSize[api.GetDisplayNameOf(Items.Item(i), SHGDN_FORPARSING | SHGDN_ORIGINAL)];
				if (n == null) {
					FV.Notify(0, Items.Item(i), null, 1);
					bYet = true;
				} else if (n === "") {
					bYet = true;
				}
			}
		}
		if (bYet) {
			if (FV.hwndList) {
				Sync.TotalFileSizeSort.cue[FV.Id] = ar;
			}
			return S_OK;
		}
		CustomSort(FV, "System.TotalFileSize", ar[1],
			function (pid, FV) {
				const wfd = api.Memory("WIN32_FIND_DATA");
				api.SHGetDataFromIDList(pid, SHGDFIL_FINDDATA, wfd, wfd.Size);
				return wfd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY ? FV.TotalFileSize[api.GetDisplayNameOf(pid, SHGDN_FORPARSING | SHGDN_ORIGINAL)] : pid.ExtendedProperty("Size");
			},
			function (a, b) {
				return api.UQuadCmp(b[1], a[1]);
			}
		);
	},

	Sort: function (Ctrl, Name) {
		if (Sync.TotalFileSizeSort.tid[Ctrl.Id]) {
			clearTimeout(Sync.TotalFileSizeSort.tid[Ctrl.Id]);
			delete Sync.TotalFileSizeSort.tid[Ctrl.Id];
		}
		if (/\-?[Tablacus|System]\.TotalFileSize$/i.test(Name)) {
			Sync.TotalFileSizeSort.DoSort(Ctrl, [Ctrl.FolderItem, /^\-/.test(Name)]);
			return true;
		}
	}
};

AddEvent("StatusText", function (Ctrl, Text, iPart) {
	for (let i in Sync.TotalFileSizeSort.cue) {
		Sync.TotalFileSizeSort.DoSort(te.Ctrl(CTRL_FV, i), Sync.TotalFileSizeSort.cue[i]);
	}
});

AddEvent("ColumnClick", function (Ctrl, iItem) {
	const cColumns = api.CommandLineToArgv(Ctrl.Columns(1));
	const s = cColumns[iItem * 2];
	if (s == "System.TotalFileSize" || (s == "System.Size" && api.GetKeyState(VK_SHIFT) < 0)) {
		Ctrl.SortColumn = (Ctrl.SortColumn != '-System.TotalFileSize') ? '-System.TotalFileSize' : 'System.TotalFileSize';
		return S_OK;
	}
});

AddEvent("Sort", function (Ctrl) {
	if (Sync.TotalFileSizeSort.tid[Ctrl.Id]) {
		clearTimeout(Sync.TotalFileSizeSort.tid[Ctrl.Id]);
		delete Sync.TotalFileSizeSort.tid[Ctrl.Id];
	}
	if (/\-?[Tablacus|System]\.TotalFileSize$/i.test(Ctrl.GetSortColumn(1))) {
		Sync.TotalFileSizeSort.tid[Ctrl.Id] = setTimeout(function () {
			Ctrl.SortColumn = Ctrl.GetSortColumn(1);
		}, 99);
	}
});

AddEvent("Sorting", Sync.TotalFileSizeSort.Sort);

//Menu
if (item.getAttribute("MenuExec")) {
	AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos) {
		api.InsertMenu(hMenu, Sync.TotalFileSizeSort.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Sync.TotalFileSizeSort.strName));
		ExtraMenuCommand[nPos] = Sync.TotalFileSizeSort.Exec;
		return nPos;
	});
}
//Key
if (item.getAttribute("KeyExec")) {
	SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Sync.TotalFileSizeSort.Exec, "Func");
}
//Mouse
if (item.getAttribute("MouseExec")) {
	SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Sync.TotalFileSizeSort.Exec, "Func");
}
//Type
AddTypeEx("Add-ons", "Total file size sort", Sync.TotalFileSizeSort.Exec);

const h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
const src = item.getAttribute("Icon") || (h <= 16 ? "bitmap:ieframe.dll,216,16,25" : "bitmap:ieframe.dll,214,24,25");
Sync.TotalFileSizeSort.str = ['<span class="button" onclick="return Addons.TotalFileSizeSort.Exec(this);" oncontextmenu="return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', GetImgTag({ title: Sync.TotalFileSizeSort.strName, src: src }, h), '</span>'].join("");
