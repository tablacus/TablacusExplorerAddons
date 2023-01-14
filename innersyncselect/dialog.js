let g_TC = {};
let g_tid;
let g_RE;

RunEventUI("BrowserCreatedEx");

Addons.InnerSyncSelect = {
	Changed: async function () {
		Addons.InnerSyncSelect.Clear();
		document.F.A.value = await Sync.InnerSyncSelect.GetFV(false).FolderItem.Path;
		document.F.B.value = await Sync.InnerSyncSelect.GetFV(true).FolderItem.Path;
	},

	SwitchExt: function (o) {
		MainWindow.Common.InnerSyncSelect.NoExt = true;
		MainWindow.Common.InnerSyncSelect.bSave = !o.checked;
	},

	Resize: async function () {
		const hwnd = await GetTopWindow();
		if (await api.IsZoomed(hwnd) || await api.IsIconic(hwnd)) {
			return;
		}
		MainWindow.Common.InnerSyncSelect.width = document.body.offsetWidth * 96 / screen.deviceYDPI;
		MainWindow.Common.InnerSyncSelect.height = document.body.offsetHeight * 96 / screen.deviceYDPI;
		MainWindow.Common.InnerSyncSelect.bSave = true;
	},

	Retry: function (name, IsB, s) {
		Addons.InnerSyncSelect.Clear();
		Addons.InnerSyncSelect.tid = setTimeout(function (name, IsB) {
			const el = document.F[name.replace(/ and | /g, "").toLowerCase() + (IsB ? "1" : "0")];
			FireEvent(el, "click");
		}, 999, name, IsB);
		Addons.InnerSyncSelect.SetTitle(s);
	},

	Clear: function () {
		if (Addons.InnerSyncSelect.tid) {
			clearTimeout(Addons.InnerSyncSelect.tid);
		}
		document.title = TITLE;
	},

	SetTitle: function (s) {
		document.title = s + " - " + TITLE;
	}
}

InitDialog = async function () {
	ApplyLang(document);
	await $.importScript("addons\\innersyncselect\\sync.js");
	await Addons.InnerSyncSelect.Changed();
	document.F.ext.checked = !await MainWindow.Common.InnerSyncSelect.NoExt;
	document.body.style.visibility = "";
	WebBrowser.OnClose = async function (WB) {
		MainWindow.InvokeUI("Addons.InnerSyncSelect.Clear");
		const hwnd = await GetTopWindow();
		if (!await api.IsZoomed(hwnd) && !await api.IsIconic(hwnd)) {
			const rc = await api.Memory("RECT");
			await api.GetWindowRect(hwnd, rc);
			let r = await Promise.all([MainWindow.Common.InnerSyncSelect.left, rc.left, MainWindow.Common.InnerSyncSelect.top, rc.top]);
			if (MainWindow.Common.InnerSyncSelect.bSave || MainWindow.Common.InnerSyncSelect.left != r[1] || MainWindow.Common.InnerSyncSelect.top != r[3]) {
				MainWindow.Common.InnerSyncSelect.left = r[1];
				MainWindow.Common.InnerSyncSelect.top = r[3];
				const ar = ["width", "height", "top", "left", "NoExt"];
				for (let i = 0; i < ar.length; ++i) {
					r[i] = MainWindow.Common.InnerSyncSelect[ar[i]];
				}
				r = await Promise.all(r);
				const db = {};
				for (let i = 0; i < ar.length; ++i) {
					db[ar[i]] = r[i];
				}
				WriteTextFile(BuildPath(await te.Data.DataFolder, "config\\innersyncselect.json"), JSON.stringify(db));
			}
		}
		MainWindow.InvokeUI("Addons.InnerSyncSelect.Close");
		WebBrowser.Close();
	};
	AddEventEx(window, "resize", Addons.InnerSyncSelect.Resize);
}

AddEventEx(document.body, "keydown", function (e) {
	if (e.keyCode == VK_ESCAPE || /^Esc/i.test(e.key)) {
		CloseWindow();
	}
	return true;
});
