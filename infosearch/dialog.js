RunEventUI("BrowserCreatedEx");

InitDialog = async function () {
	ApplyLang(document);
	FV = await te.Ctrl(CTRL_FV);
	const folder = await api.ILCreateFromPath("C:\\").GetFolder;
	for (let i = 0; i < 999; i++) {
		const s = await folder.GetDetailsOf(null, i);
		if (s) {
			const option = document.createElement("option");
			option.text = s;
			option.value = await api.PSGetDisplayName(s, 1);
			document.F.info.appendChild(option);
		}
	}
	const ar = (await MainWindow.Sync.InfoSearch.GetSearchString(FV)).split("|");
	if (ar.length > 1) {
		document.F.location.value = ar.shift();
		document.F.name.value = ar.shift();
		const info = ar.shift();
		for (let i = document.F.info.length; i--;) {
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
	document.body.style.display = "";
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
	FV.Navigate("infosearch:" + [document.F.location.value, document.F.name.value, document.F.info.value, document.F.content.value.replace(/%/g, "%25").replace(/\//g, "%2F")].join("|"), document.F.newtab.checked ? SBSP_NEWBROWSER : SBSP_SAMEBROWSER);
	CloseWindow();
}
