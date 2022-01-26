RunEventUI("BrowserCreatedEx");

AddEventEx(document.body, "keydown", function (e) {
	if (e.keyCode == VK_RETURN || /^Enter/i.test(e.key)) {
		SetFolderData();
	}
	if (e.keyCode == VK_ESCAPE || /^Esc/i.test(e.key)) {
		CloseWindow();
	}
	return true;
});

InitDialog = async function () {
	ApplyLang(document);
	let path = await dialogArguments.path;
	g_path = path;
	if (/^([1-9]+\d*)$/.test(path)) {
		const Item = /^([1-9]+\d*)$/.test(path) ? await api.ILCreateFromPath(path) : await api.SHSimpleIDListFromPath(path, FILE_ATTRIBUTE_DIRECTORY, new Date(ar[0] - 0).getTime(), 0);
		Item.IsFolder;
		path = await api.GetDisplayNameOf(Item, SHGDN_FORPARSING | SHGDN_FORADDRESSBAR);
	}
	document.title = path + " - Tablacus Explorer";
	let ar = await MainWindow.Common.Remember.db[g_path];
	if (window.chrome) {
		ar = await api.CreateObject("SafeArray", ar);
	}
	document.F.Columns.value = ar[3];
	document.F.Sort.value = ar[4];
	document.F.Sort2.value = ar[6];
	document.F.Group.value = ar[5];
	document.F.View.value = ar[1];
	document.F.Icon.value = ar[2];
	document.body.style.visibility = "";
};

GetCurrentSetting = async function () {
	const nFormat = await MainWindow.Sync.Remember.nFormat;
	const FV = await te.Ctrl(CTRL_FV);
	if (FV) {
		document.F.Columns.value = await FV.GetColumns(nFormat);
		document.F.Sort.value = await FV.GetSortColumn(nFormat);
		const s = await FV.SortColumns;
		document.F.Sort2.value = /;/.test(s) ? s : "";
		document.F.Group.value = await FV.GroupBy;
		document.F.View.value = await FV.CurrentViewMode;
		document.F.Icon.value = await FV.IconSize;
	}
}

SetSetting = async function () {
	let ar = await api.CreateObject("Array");
	ar.push(new Date().getTime(), document.F.View.value, document.F.Icon.value, document.F.Columns.value, document.F.Sort.value, document.F.Group.value, document.F.Sort2.value);
	MainWindow.Common.Remember.db[g_path] = ar;
	if (window.chrome) {
		ar = await api.CreateObject("SafeArray", ar);
	}

	const cFV = await te.Ctrls(CTRL_FV, false, window.chrome);
	for (let i = 0; i < cFV.length; ++i) {
		const FV = await cFV[i];
		const path = await MainWindow.Sync.Remember.GetPath(FV);
		if (path === g_path) {
			if (await FV.hwndView) {
				FV.SetViewMode(ar[1], ar[2]);
				FV.Columns = ar[3];
				if (await FV.GroupBy && ar[5]) {
					FV.GroupBy = ar[5];
				}
				if ((ar[6] || "").split(/;/).length > 2 && await FV.SortColumns) {
					FV.SortColumns = ar[6];
				} else {
					FV.SortColumn = ar[4];
				}
			}
		}
	}
	CloseWindow();
	return true;
};
