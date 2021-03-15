let g_TC = {};
let g_tid;
let g_RE;

RunEventUI("BrowserCreatedEx");

Addons.SyncSelect = {
	Changed: async function () {
		Addons.SyncSelect.Clear();
		document.F.A.value = await Sync.SyncSelect.GetFV(false).FolderItem.Path;
		document.F.B.value = await Sync.SyncSelect.GetFV(true).FolderItem.Path;
	},

	SwitchExt: function (o) {
		MainWindow.Common.SyncSelect.NoExt = !o.checked;
		MainWindow.Common.SyncSelect.bSave = true;
	},

	Resize: async function () {
		const hwnd = await GetTopWindow();
		if (await api.IsZoomed(hwnd) || await api.IsIconic(hwnd)) {
			return;
		}
		MainWindow.Common.SyncSelect.width = document.body.offsetWidth * 96 / screen.deviceYDPI;
		MainWindow.Common.SyncSelect.height = document.body.offsetHeight * 96 / screen.deviceYDPI;
		MainWindow.Common.SyncSelect.bSave = true;
	},

	Retry: function (name, IsB, s) {
		Addons.SyncSelect.Clear();
		Addons.SyncSelect.tid = setTimeout(function (name, IsB) {
			const el = document.F[name.replace(/ and | /g, "").toLowerCase() + (IsB ? "1" : "0")];
			FireEvent(el, "click");
		}, 999, name, IsB);
		Addons.SyncSelect.SetTitle(s);
	},

	Clear: function () {
		if (Addons.SyncSelect.tid) {
			clearTimeout(Addons.SyncSelect.tid);
		}
		document.title = TITLE;
	},

	SetTitle: function (s) {
		document.title = s + " - " + TITLE;
	}
}

InitDialog = async function () {
	ApplyLang(document);
	await $.importScript("addons\\syncselect\\sync.js");
	await Addons.SyncSelect.Changed();
	document.F.ext.checked = !await MainWindow.Common.SyncSelect.NoExt;
	document.body.style.visibility = "";
	WebBrowser.OnClose = async function (WB) {
		MainWindow.InvokeUI("Addons.SyncSelect.Clear");
		const hwnd = await GetTopWindow();
		if (!await api.IsZoomed(hwnd) && !await api.IsIconic(hwnd)) {
			const rc = await api.Memory("RECT");
			await api.GetWindowRect(hwnd, rc);
			let r = await Promise.all([MainWindow.Common.SyncSelect.left, rc.left, MainWindow.Common.SyncSelect.top, rc.top]);
			if (MainWindow.Common.SyncSelect.bSave || MainWindow.Common.SyncSelect.left != r[1] || MainWindow.Common.SyncSelect.top != r[3]) {
				MainWindow.Common.SyncSelect.left = r[1];
				MainWindow.Common.SyncSelect.top = r[3];
				const ar = ["width", "height", "top", "left", "NoExt"];
				for (let i = 0; i < ar.length; ++i) {
					r[i] = MainWindow.Common.SyncSelect[ar[i]];
				}
				r = await Promise.all(r);
				const db = {};
				for (let i = 0; i < ar.length; ++i) {
					db[ar[i]] = r[i];
				}
				WriteTextFile(BuildPath(await te.Data.DataFolder, "config\\syncselect.json"), JSON.stringify(db));
			}
		}
		MainWindow.InvokeUI("Addons.SyncSelect.Close");
		WebBrowser.Close();
	};
	AddEventEx(window, "resize", Addons.SyncSelect.Resize);
}

AddEventEx(document.body, "keydown", function (e) {
	if (e.keyCode == VK_ESCAPE || /^Esc/i.test(e.key)) {
		CloseWindow();
	}
	return true;
});
