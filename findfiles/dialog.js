RunEventUI("BrowserCreatedEx");

InitDialog = async function () {
    FV = await te.Ctrl(CTRL_FV);
    var ar = (await MainWindow.Sync.FindFiles.GetSearchString(FV)).split("|");
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
    WebBrowser.Focus();
    document.F.name.focus();
    document.body.style.display = "";
};

AddEventEx(document.body, "keydown", function (ev) {
    if (ev.keyCode == VK_RETURN || window.chrome && /^Enter/i.test(e.key)) {
        if (document.F.location.value && (document.F.name.value || document.F.content.value)) {
            FindFiles();
        }
    }
	if (ev.keyCode == VK_ESCAPE || window.chrome && /^Esc/i.test(e.key)) {
        CloseWindow();
    }
    return true;
});

FindFiles = async function () {
    await FV.Navigate("findfiles:" + [document.F.location.value, document.F.name.value, document.F.content.value.replace(/%/g, "%25").replace(/\//g, "%2F")].join("|"), document.F.newtab.checked ? SBSP_NEWBROWSER : SBSP_SAMEBROWSER);
    CloseWindow();
}
