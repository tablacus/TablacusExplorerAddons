RunEventUI("BrowserCreatedEx");

InitDialog = async function () {
	ApplyLang(document);
	FV = await te.Ctrl(CTRL_FV);
	var folder = await api.ILCreateFromPath("C:\\").GetFolder;
	for (var i = 0; i < 999; i++) {
		var s = await folder.GetDetailsOf(null, i);
		if (s) {
			var option = document.createElement("option");
			option.text = s;
			option.value = await api.PSGetDisplayName(s, 1);
			document.F.info.appendChild(option);
		}
	}
	var ar = (await MainWindow.Sync.InfoSearch.GetSearchString(FV)).split("|");
	if (ar.length > 1) {
		document.F.location.value = ar.shift();
		document.F.name.value = ar.shift();
		var info = ar.shift();
		for (var i = document.F.info.length; i--;) {
			if (document.F.info[i].value == info) {
				document.F.info.selectedIndex = i;
				break;
			}
		}
		document.F.content.value = ar.join("|").replace(/%2F/g, "/").replace(/%25/g, "%");
	} else {
		document.F.location.value = await FV.FolderItem.Path;
		document.F.newtab.checked = true;
	}
	document.title = await MainWindow.Sync.InfoSearch.strName;
	WebBrowser.Focus();
	document.F.name.focus();
	document.body.style.display = "";
};

AddEventEx(document.body, "keydown", function (e) {
	if (e.keyCode == VK_RETURN || window.chrome && /^Enter/i.test(e.key)) {
		if (document.F.location.value && (document.F.name.value || document.F.content.value)) {
			FindFiles();
		}
	}
	if (e.keyCode == VK_ESCAPE || window.chrome && /^Esc/i.test(e.key)) {
		CloseWindow();
	}
	return true;
});

FindFiles = async function () {
	FV.Navigate("infosearch:" + [document.F.location.value, document.F.name.value, document.F.info.value, document.F.content.value.replace(/%/g, "%25").replace(/\//g, "%2F")].join("|"), document.F.newtab.checked ? SBSP_NEWBROWSER : SBSP_SAMEBROWSER);
	CloseWindow();
}
