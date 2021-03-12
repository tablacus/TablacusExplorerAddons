
let g_TC = {};
let g_tid;
let g_RE;

RunEventUI("BrowserCreatedEx");

InitDialog = async function () {
	ApplyLang(document);
	await $.importScript("addons\\syncselect\\sync.js");
	await SyncSelectChanged();
	document.body.style.visibility = "";
	WebBrowser.OnClose = async function (WB) {
		MainWindow.InvokeUI("Addons.SyncSelect.Close");
		WebBrowser.Close();
	};
}

SyncSelectChanged = async function () {
	document.F.A.value = await Sync.SyncSelect.GetFV(false).FolderItem.Path;
	document.F.B.value = await Sync.SyncSelect.GetFV(true).FolderItem.Path;
}

SwitchExt = function (o) {
	Common.SyncSelect.Ext = o.checked;
}

AddEventEx(document.body, "keydown", function (e) {
	if (e.keyCode == VK_ESCAPE || /^Esc/i.test(e.key)) {
		CloseWindow();
	}
	return true;
});
