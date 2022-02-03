Addons = {};
RunEventUI("BrowserCreatedEx");

Common.PreviewWindow = async function (hwnd, bFocus) {
	const desc = document.getElementById("desc1");
	const img1 = document.getElementById("img1");
	const div1 = document.getElementById("div1");
	div1.innerHTML = "";
	div1.style.height = "";
	Addons.PreviewWindow.desc = "";

	document.title = await MainWindow.Sync.PreviewWindow.strName;
	if (MainWindow.Sync.PreviewWindow.Item) {
		let Item = await MainWindow.Sync.PreviewWindow.Item;
		const ar = [];
		const col = ["Type", "Write", "Dimensions", "System.Photo.Orientation"];
		if (!await IsFolderEx(Item)) {
			col.push("size");
		}
		for (let i = col.length; i--;) {
			const s = await api.PSFormatForDisplay(col[i], await Item.ExtendedProperty(col[i]), PDFF_DEFAULT);
			if (s) {
				ar.unshift(" " + await api.PSGetDisplayName(col[i]) + ": " + s);
			}
		}
		let Handled = false;
		let path = await Item.ExtendedProperty("linktarget");
		if (path) {
			Item = await api.ILCreateFromPath(path);
		} else {
			path = await Item.Path;
		}
		if (!await IsCloud(Item)) {
			if (await PathMatchEx(path, await MainWindow.Sync.PreviewWindow.TextFilter)) {
				let el;
				if (await Item.ExtendedProperty("Size") <= await MainWindow.Sync.PreviewWindow.TextLimit) {
					const ado = await OpenAdodbFromTextFile(path, await MainWindow.Sync.PreviewWindow.Charset);
					if (ado) {
						el = document.createElement("textarea");
						el.innerHTML = await ado.ReadText(await MainWindow.Sync.PreviewWindow.TextSize);
						ado.Close()
					}
				}
				if (el) {
					el.style.width = "100%";
					el.style.height = "calc(100vh - 5em)";
					div1.appendChild(el);
					Handled = true;
				}
			}
			if (await api.PathMatchSpec(path, await MainWindow.Sync.PreviewWindow.Embed)) {
				ar.unshift('<input type="button" value=" &#x25B6; " title="Play" id="play1"" onclick="Addons.PreviewWindow.Play()">');
				img1.style.display = "none";
				img1.onclick = Addons.PreviewWindow.Play;
				img1.style.cursor = "pointer";
				document.getElementById("desc1").innerHTML = ar.join("<br>");
			} else {
				img1.style.cursor = "";
			}
		}
		document.title = await Item.Name;
		Addons.PreviewWindow.info = ar;
		if (!Handled) {
			img1.onload = Addons.PreviewWindow.Loaded;
			if ((!window.chrome && GetNum(Item.ExtendedProperty("System.Photo.Orientation")) > 1) || !await fso.FileExists(path)) {
				Addons.PreviewWindow.FromFile();
			} else {
				img1.onerror = Addons.PreviewWindow.FromFile;
				img1.src = path;
			}
		}
	} else {
		desc.innerHTML = "";
	}
	if (!await MainWindow.Sync.PreviewWindow.Focus) {
		api.SetForegroundWindow(hwnd);
	}
	Addons.PreviewWindow.GetRect();
	if (bFocus) {
		const hwnd = await GetTopWindow();
		if (hwnd) {
			if (await api.IsIconic(hwnd)) {
				api.ShowWindow(hwnd, SW_RESTORE);
			}
			if (MainWindow.Sync.Focus) {
				MainWindow.Sync.Focus = void 0;
				WebBrowser.Focus();
			}
		}
	}
};

Addons.PreviewWindow = {
	tid: null,
	r: 1,

	FromFile: async function () {
		const o = await api.CreateObject("Object");
		o.path = await MainWindow.Sync.PreviewWindow.Item;
		o.Parent = await MainWindow.Sync.PreviewWindow;
		o.cx = Math.max(document.documentElement.offsetWidth || document.body.offsetWidth, document.documentElement.offsetHeight || document.body.offsetHeight);
		o.f = true;
		o.quality = window.chrome ? -2 : -1;
		o.type = GetEncodeType(await o.path.Path);
		o.anime = true;
		o.onload = async function (o) {
			const org = await o.Parent.Item;
			const path = await o.path.Path;
			if (org && SameText(path, await org.Path)) {
				document.getElementById("desc1").innerHTML = Addons.PreviewWindow.info.join("<br>");
				const img = document.getElementById("img1");
				img.title = Addons.PreviewWindow.info.join("\n");
				img.src = await o.out;
				img.style.display = "";
			}
		};
		o.onerror = async function (o) {
			if (!await IsFolderEx(await o.path) && api.PathMatchSpec(await o.path.Path, await o.Parent.Extract)) {
				const Items = await api.CreateObject("FolderItems");
				Items.AddItem(await o.path);
				await te.OnBeforeGetData(await te.Ctrl(CTRL_FV), Items, 11);
				if (await IsExists(await o.path.Path)) {
					o.onerror = null;
					MainWindow.Threads.GetImage(o);
					return;
				}
			}
			document.getElementById("img1").style.display = "none";
			document.getElementById("desc1").innerHTML = Addons.PreviewWindow.info.join("<br>");
		};
		MainWindow.Threads.GetImage(o);
		document.getElementById("img1").onerror = null;
	},

	Loaded: async function () {
		document.getElementById("img1").style.display = "";
		const Item = MainWindow.Sync.PreviewWindow.Item;
		const wh = "Dimensions";
		let s = await api.PSFormatForDisplay(wh, await Item.ExtendedProperty(wh), PDFF_DEFAULT);
		if (s) {
			s = ' (' + s + ')';
		}
		document.title = await MainWindow.Sync.PreviewWindow.Item.Name + s;
	},

	Move: async function (nMove, bFocus) {
		MainWindow.Sync.PreviewWindow.Focus = bFocus;
		const FV = await te.Ctrl(CTRL_FV);
		const nCount = await FV.ItemCount(SVGIO_ALLVIEW);
		const nIndex = (await FV.GetFocusedItem + nMove + nCount) % nCount;
		FV.SelectItem(nIndex, SVSI_SELECT | SVSI_DESELECTOTHERS | SVSI_FOCUSED | SVSI_ENSUREVISIBLE | SVSI_NOTAKEFOCUS);
	},

	GetRect: async function () {
		const rc = await api.Memory("RECT");
		const hwnd = await GetTopWindow();
		if (!await api.IsZoomed(hwnd)) {
			await api.GetWindowRect(hwnd, rc);
			if (await te.Data.AddonsData.PreviewWindow.left != await rc.Left) {
				te.Data.AddonsData.PreviewWindow.left = await rc.Left;
				te.Data.bSaveConfig = true;
			}
			if (await te.Data.AddonsData.PreviewWindow.top != await rc.Top) {
				te.Data.AddonsData.PreviewWindow.top = await rc.Top;
				te.Data.bSaveConfig = true;
			}
			const o = document.documentElement || document.body;
			if (await te.Data.AddonsData.PreviewWindow.width != o.offsetWidth) {
				te.Data.AddonsData.PreviewWindow.width = o.offsetWidth;
				te.Data.bSaveConfig = true;
			}
			if (await te.Data.AddonsData.PreviewWindow.height != o.offsetHeight) {
				te.Data.AddonsData.PreviewWindow.height = o.offsetHeight;
				te.Data.bSaveConfig = true;
			}
		}
	},

	Play: async function () {
		const div1 = document.getElementById("div1");
		const path = await MainWindow.Sync.PreviewWindow.Item.ExtendedProperty("linktarget") || await MainWindow.Sync.PreviewWindow.Item.Path;
		if (!window.chrome && await api.PathMatchSpec(path, "*.wav")) {
			api.PlaySound(path, null, 3);
		} else if (ui_.IEVer >= 11 && await api.PathMatchSpec(path, window.chrome ? "*.mp3;*.m4a;*.wav;*.pcm;*.oga;*.flac;*.fla" : "*.mp3;*.m4a")) {
			document.getElementById("play1").style.display = "none";
			div1.innerHTML = '<audio controls autoplay style="width: 100%"><source src="' + path + '"></audio>';
		} else {
			document.getElementById("img1").style.display = "none";
			document.getElementById("desc1").innerHTML = "";
			div1.style.height = g_.IEVer >= 8 ? "calc(100% - 5px)" : "99%";
			if (window.chrome || (ui_.IEVer >= 11 && await api.PathMatchSpec(path, "*.mp4"))) {
				div1.innerHTML = '<video controls autoplay style="width: 100%; max-height: 100%"><source src="' + path + '"></video>';
			} else {
				div1.innerHTML = '<embed width="100%" height="100%" src="' + path + '" autoplay="true"></embed>';
			}
		}
	}
};

InitPreview = function () {
	ApplyLang(document);
	MainWindow.Sync.PreviewWindow.Arrange()
}

WebBrowser.OnClose = async function (WB) {
	MainWindow.Sync.PreviewWindow.dlg = void 0;
	Addons.PreviewWindow.GetRect();
	WB.Close();
}

AddEventEx(window, "resize", Addons.PreviewWindow.GetRect);

AddEventEx(window, "keydown", function (e) {
	if (e.keyCode == VK_LEFT || e.keyCode == VK_UP || e.keyCode == VK_BACK) {
		Addons.PreviewWindow.Move(-1, true);
		return true;
	}
	if (e.keyCode == VK_RIGHT || e.keyCode == VK_DOWN || e.keyCode == VK_RETURN || e.keyCode == VK_SPACE) {
		Addons.PreviewWindow.Move(1, true);
		return true;
	}
});

AddEventEx(window, "dblclick", function (ev) {
	Addons.PreviewWindow.Move(ev.shiftKey ? -1 : 1);
	return true;
});

AddEventEx(window, "mouseup", function (ev) {
	if ((ev.buttons != null ? ev.buttons : ev.button) == 2) {
		Addons.PreviewWindow.Move(-1);
		return true;
	}
	if ((ev.buttons != null ? ev.buttons : ev.button) == 1) {
		Addons.PreviewWindow.Move(1);
		return true;
	}
});

FullscreenChange = async function () {
	const hwnd = await GetTopWindow();
	if (document.msFullscreenElement || document.fullscreenElement) {
		api.SendMessage(hwnd, WM_SYSCOMMAND, SC_MAXIMIZE, 0);
	} else {
		api.SendMessage(hwnd, WM_SYSCOMMAND, SC_RESTORE, 0);
	}
}

AddEventEx(document, "MSFullscreenChange", FullscreenChange);
AddEventEx(document, "fullscreenchange", FullscreenChange);
