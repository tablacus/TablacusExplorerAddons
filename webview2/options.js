SetTabContents(4, "General", await ReadTextFile(BuildPath("addons", Addon_Id, "options.html")));

Addons.WebView2 = {
	Info: async function () {
		for (let i = 32; i <= 64; i += 32) {
			const fn = "tewv" + i + ".dll";
			const ar = [];
			ar.push(fn);
			let ver;
			try {
				ver = await fso.GetFileVersion(BuildPath(ui_.Installed, "lib", fn));
			} catch (e) { }
			if (ver) {
				ar.push(await GetText('Installed'), "( " + ver + " )");
			} else {
				document.E.delete.disabled = true;
				ar.push('<b class="danger">' + await GetText('None') + '</b>');
			}
			document.getElementById("ver" + i).innerHTML = ar.join(" ");
		}
		document.E.Get.value = await api.sprintf(99, await GetText("Get %s..."), "Microsoft Edge WebView2 Runtime");
		const lang = (navigator.userLanguage || navigator.language).toLowerCase();
		document.E.Get.title = "https://developer.microsoft.com/" + lang + "/microsoft-edge/webview2/";
		if (/^ja/.test(lang)) {
			document.E.Web.title = "https://tablacus.github.io/tewv2_ja.html";
		}
		const res = window.chrome && /(Edg\/[\d\.]+)/.exec(navigator.appVersion);
		document.getElementById("browser").innerHTML = [res ? res[1] : 'IE/' + await g_.IEVer, "(", await GetText(ui_.bit + "-bit"), ")"].join(" ");
	},

	CheckUpdate: function () {
		OpenHttpRequest("https://api.github.com/repos/tablacus/TablacusExplorerWebView2/releases/latest", "", "Addons.WebView2.CheckUpdate2");
	},

	CheckUpdate2: async function (xhr) {
		const arg = await api.CreateObject("Object");
		const Text = await xhr.get_responseText ? await xhr.get_responseText() : xhr.responseText;
		const json = JSON.parse(Text);
		if (json.assets && json.assets[0]) {
			arg.size = json.assets[0].size / 1024;
			arg.url = json.assets[0].browser_download_url;
		}
		arg.file = GetFileName((await arg.url).replace(/\//g, "\\"));
		const res = /tewv2_(\d\d)(\d\d)(\d\d)\.zip$/i.exec(await arg.file);
		if (!res) {
			return;
		}
		const ar = [];
		let ver;
		try {
			ver = await fso.GetFileVersion(BuildPath(ui_.Installed, "lib", "tewv" + ui_.bit + ".dll"));
		} catch (e) { }
		if (ver && await CalcVersion(ver) < await CalcVersion([res[1] - 0, res[2] - 0, res[3] - 0, 0].join("."))) {
			ar.push(await GetText("Update available"));
		}
		ar.push("Tablacus Explorer WebView2");
		ar.push((await api.LoadString(hShell32, 60) || "%").replace(/%.*/, await api.sprintf(99, "%d.%d.%d (%.1lfKB)", res[1], res[2], res[3], await arg.size)));
		ar.push(await GetText("Do you want to install it now?"));
		if (!await confirmOk(ar.join("\n"))) {
			return;
		}
		const temp = await GetTempPath(3);
		await CreateFolder(temp);
		arg.zipfile = BuildPath(temp, await arg.file);
		arg.temp = BuildPath(temp, "explorer");
		await CreateFolder(await arg.temp);
		OpenHttpRequest(await arg.url, "", "Addons.WebView2.CheckUpdate3", arg);
	},

	CheckUpdate3: async function (xhr, url, arg) {
		let hr = await Extract(await arg.zipfile, await arg.temp, xhr);
		if (hr) {
			await MessageBox([(await api.LoadString(hShell32, 4228)).replace(/^\t/, "").replace("%d", await api.sprintf(99, "0x%08x", hr)), await GetText("Extract"), GetFileName(arg.zipfile)].join("\n\n"), TITLE, MB_OK | MB_ICONSTOP);
			return;
		}
		const dll32 = BuildPath(await arg.temp, "lib\\tewv32.dll");
		const dll64 = BuildPath(await arg.temp, "lib\\tewv64.dll");
		let nDog = 300;
		while (!await fso.FileExists(dll32) || !await fso.FileExists(dll64)) {
			if (await wsh.Popup(await GetText("Please wait."), 1, TITLE, MB_OKCANCEL) == IDCANCEL || nDog-- == 0) {
				return;
			}
		}
		arg.Boot = true;
		setTimeout(MainWindow.UpdateAndReload, 500, arg);
	},

	Delete: async function () {
		if (!await confirmOk()) {
			return;
		}
		const temp = await GetTempPath(3);
		await CreateFolder(temp);
		MainWindow.g_.strUpdate = [PathQuoteSpaces(BuildPath(await api.IsWow64Process(await api.GetCurrentProcess()) ? await wsh.ExpandEnvironmentStrings("%SystemRoot%\\Sysnative") : system32, "wscript.exe")), PathQuoteSpaces(BuildPath(ui_.Installed, "script\\update.js")), PathQuoteSpaces(ui_.TEPath), ' ', PathQuoteSpaces(BuildPath(ui_.Installed, "lib\\tewv??.dll")), PathQuoteSpaces(await api.LoadString(hShell32, 12612)), '""', PathQuoteSpaces(temp), 'Move', FOF_SILENT | FOF_NOCONFIRMATION | FOF_NOERRORUI].join(" ");
		MainWindow.DeleteTempFolder = await MainWindow.PerformUpdate;
		api.PostMessage(ui_.hwnd, WM_CLOSE, 0, 0);
	}
}

setTimeout(Addons.WebView2.Info, 99);
