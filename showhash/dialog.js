RunEventUI("BrowserCreatedEx");

InitDialog = async function () {
	await ApplyLang(document);
	const item = await dialogArguments.Selected.Item(0);
	const path = await item.Path;
	const promise = [];
	const alg = ["MD5", "SHA1", "SHA256", "SHA384", "SHA512"];
	for (let i = 0; i < alg.length; ++i) {
		promise.push(api.CreateProcess(["certutil -hashfile", PathQuoteSpaces(path), alg[i]].join(" ")));
	}
	Promise.all(promise).then(async function (r) {
		const html = [];
		for (let i = 0; i < r.length; ++i) {
			const ar = r[i].split(/\r?\n/);
			html.push(ar[0], ar[1], "");
		}
		document.getElementById("P").innerHTML = html.join("<br>");
		document.F.style.display = "";
		WebBrowser.Focus();
		setTimeout(function () {
			document.body.onselectstart = function () {
				return true;
			}
		}, 999);
	});
	document.title = await MainWindow.Sync.ShowHash.sName;
};


AddEventEx(document.body, "keydown", function (e) {
	if (e.keyCode == VK_RETURN || window.chrome && /^Enter/i.test(e.key)) {
		CloseWindow();
	}
	if (e.keyCode == VK_ESCAPE || window.chrome && /^Esc/i.test(e.key)) {
		CloseWindow();
	}
	return true;
});
