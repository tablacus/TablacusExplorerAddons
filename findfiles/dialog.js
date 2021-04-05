RunEventUI("BrowserCreatedEx");

InitDialog = async function () {
    FV = await te.Ctrl(CTRL_FV);
    const ar = (await MainWindow.Sync.FindFiles.GetSearchString(FV)).split("|");
    if (ar.length > 1) {
        document.F.location.value = ar.shift();
        document.F.name.value = ar.shift();
        document.F.content.value = ar.join("|").replace(/%2F/g, "/").replace(/%25/g, "%");
    } else {
        document.F.location.value = await FV.FolderItem.Path;
        document.F.newtab.checked = true;
    }
    document.title = await MainWindow.Sync.FindFiles.strName;
    await ApplyLang(document);
	document.F.style.visibility = "";
	setTimeout(function () {
		WebBrowser.Focus();
		document.F.name.focus();
	}, 99);
};

AddEventEx(document.body, "keydown", function (ev) {
	return KeyDownEvent(ev, function () {
		if (document.F.location.value && (document.F.name.value || document.F.content.value)) {
			FindFiles();
		}
	}, CloseWindow);
});

FindFiles = async function () {
    await FV.Navigate("findfiles:" + [document.F.location.value, document.F.name.value, document.F.content.value.replace(/%/g, "%25").replace(/\//g, "%2F")].join("|"), document.F.newtab.checked ? SBSP_NEWBROWSER : SBSP_SAMEBROWSER);
    CloseWindow();
}
