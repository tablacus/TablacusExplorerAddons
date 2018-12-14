document.onkeydown = function ()
{
	if (event.keyCode == VK_ESCAPE) {
		window.close();
	}
	if (event.keyCode == VK_RETURN) {
		SetFolderData();
	}
	return true;
};

AddEventEx(window, "load", function ()
{
	ApplyLang(document);
	var path = dialogArguments.path;
	g_path = path;
	if (/^([1-9]+\d*)$/.test(path)) {
		var Item = /^([1-9]+\d*)$/.test(path) ? api.ILCreateFromPath(path) : api.SHSimpleIDListFromPath(path, FILE_ATTRIBUTE_DIRECTORY, new Date(ar[0] - 0), 0);
		Item.IsFolder;
		path = api.GetDisplayNameOf(Item, SHGDN_FORPARSING | SHGDN_FORADDRESSBAR | SHGDN_ORIGINAL);
	}
	document.title = path + " - Tablacus Explorer";

	var ar = MainWindow.Addons.Remember.db[dialogArguments.path];
	document.F.Columns.value = ar[3];
	document.F.Sort.value = ar[4];
	document.F.Sort2.value = ar[6];
	document.F.Group.value = ar[5];
	document.F.View.value = ar[1];
	document.F.Icon.value = ar[2];
});

function GetCurrentSetting()
{
	var nFormat = MainWindow.Addons.Remember.nFormat;
	var FV = te.Ctrl(CTRL_FV);
	if (FV) {
		document.F.Columns.value = FV.Columns(nFormat);
		document.F.Sort.value = FV.SortColumn(nFormat);
		var s = FV.SortColumns;
		document.F.Sort2.value = /;/.test(s) ? s : "";
		document.F.Group.value = FV.GroupBy;
		document.F.View.value = FV.CurrentViewMode;
		document.F.Icon.value = FV.IconSize;
	}
}

function SetSetting ()
{
	var ar = [new Date().getTime(), document.F.View.value, document.F.Icon.value, document.F.Columns.value, document.F.Sort.value, document.F.Group.value, document.F.Sort2.value];
	MainWindow.Addons.Remember.db[g_path] = ar;

	var cFV = te.Ctrls(CTRL_FV);
	for (var i in cFV) {
		var FV = cFV[i];
		var path = MainWindow.Addons.Remember.GetPath(FV);
		if (path === g_path) {
			if (FV.hwndView) {
				FV.CurrentViewMode(ar[1], ar[2]);
				FV.Columns = ar[3];
				if (FV.GroupBy && ar[5]) {
					FV.GroupBy = ar[5];
				}
				if ((ar[6] || "").split(/;/).length > 2 && FV.SortColumns) {
					FV.SortColumns = ar[6];
				} else {
					FV.SortColumn = ar[4];
				}
			}
		}
	}
	window.close();
	return true;
};
