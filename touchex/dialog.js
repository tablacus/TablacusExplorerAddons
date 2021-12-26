RunEventUI("BrowserCreatedEx");

InitDialog = async function () {
	await ApplyLang(document);
	const item = await dialogArguments.Selected.Item(0);
	let s = await item.Path;
	const wfd = await api.Memory("WIN32_FIND_DATA");
	const hFind = await api.FindFirstFile(s, wfd);
	if (hFind == INVALID_HANDLE_VALUE) {
		if (await api.SHGetDataFromIDList(item, SHGDFIL_FINDDATA, wfd, await wfd.Size) != S_OK) {
			CloseWindow();
		}
	} else {
		api.FindClose(hFind);
	}
	const promise = [wfd.ftLastWriteTime, wfd.ftCreationTime, wfd.ftLastAccessTime];
	for (let i = 0; i < 3; ++i) {
		promise.push(api.PSGetDisplayName("{B725F130-47EF-101A-A5F1-02608C9EEBAC} " + (i + 14)));
	}
	promise.push(dialogArguments.Selected.Count, te.OnReplacePath(s));
	Promise.all(promise).then(async function (r) {
		const n = r[6];
		s = r[7] || s;
		document.getElementById("Path").innerHTML = (n > 1) ? s += " : " + n : s;
		for (let i = 0; i < 3; ++i) {
			document.getElementById("label_" + i).innerHTML = r[i + 3];
			s = await FormatDateTime(r[i]);
			document.F.elements["dt_" + i].value = s;
			document.getElementById("od_" + i).innerHTML = s;
		}
		document.F.style.display = "";
		WebBrowser.Focus();
		document.F.dt_0.select();
		document.F.dt_0.focus();
	});
	document.title = await MainWindow.Sync.TouchEx.sName;
};

SetTimeStamp = async function () {
	for (let i = await dialogArguments.Selected.Count; i-- > 0;) {
		SetFileTime(await dialogArguments.Selected.Item(i).Path, document.F.dt_1.value, document.F.dt_2.value, document.F.dt_0.value);
	}
	CloseWindow();
	return true;
};

AddEventEx(document.body, "keydown", function (e) {
	if (e.keyCode == VK_RETURN || window.chrome && /^Enter/i.test(e.key)) {
		SetTimeStamp();
	}
	if (e.keyCode == VK_ESCAPE || window.chrome && /^Esc/i.test(e.key)) {
		CloseWindow();
	}
	return true;
});
