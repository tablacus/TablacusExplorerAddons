Addons = {};
RunEventUI("BrowserCreatedEx");

Common.PreviewWindow = async function (hwnd, bFocus) {
	const desc = document.getElementById("desc1");
	const img1 = document.getElementById("img1");
	const div1 = document.getElementById("div1");
	div1.style.height = "";
	div1.innerHTML = "";
	Addons.PreviewWindow.desc = "";

	document.title = await MainWindow.Sync.PreviewWindow.strName;
	if (await MainWindow.Sync.PreviewWindow.Item) {
		let Item = await MainWindow.Sync.PreviewWindow.Item;
		let elText;
		const ar = [];
		const col = ["Type", "Write", "Dimensions"];
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
				if (await Item.ExtendedProperty("Size") <= await MainWindow.Sync.PreviewWindow.TextLimit) {
					const ado = await OpenAdodbFromTextFile(path, await MainWindow.Sync.PreviewWindow.Charset);
					if (ado) {
						elText = document.createElement("textarea");
						elText.readOnly = true;
						elText.innerHTML = await ado.ReadText(await MainWindow.Sync.PreviewWindow.TextSize);
						ado.Close();
					}
				}
				Handled = elText;
			}
			if (window.chrome || g_.IEVer > 8) {
				if (/\.svg$/i.test(path)) {
					const res = /(<svg)([\w\W]*?<\/svg[^>]*>)/i.exec(await ReadTextFile(path));
					if (res) {
						ar.unshift(res[1] + ' style="max-width: 100%; max-height: calc(100vh - 6em)"' + res[2]);
						Handled = true;
					}
				}
			}
			if (await api.PathMatchSpec(path, await MainWindow.Sync.PreviewWindow.Embed)) {
				ar.unshift('<input type="button" value=" &#x25B6; " title="' + (await GetTextR("@wmploc.dll,-1800")) + '" id="play1"" onclick="Addons.PreviewWindow.Play()">');
				img1.onclick = Addons.PreviewWindow.Play;
				img1.style.cursor = "pointer";
				Handled = true;
			} else {
				img1.onclick = null;
				img1.style.cursor = "";
			}
		}
		Addons.PreviewWindow.info = ar;
		if (Handled) {
			img1.style.display = "none";
			const desc1 = document.getElementById("desc1");
			if (elText) {
				desc1.innerHTML = "";
				elText.style.width = "100%";
				elText.style.height = "calc(100vh - 5em)";
				desc1.appendChild(elText);
				desc1.insertAdjacentHTML("beforeend", ar.join("<br>"));
			} else {
				desc1.innerHTML = ar.join("<br>");
			}
			document.title = await MainWindow.Sync.PreviewWindow.Item.Name;
		} else {
			img1.onload = Addons.PreviewWindow.Loaded;
			if (!REGEXP_IMAGE.test(path) || (!window.chrome && GetNum(Item.ExtendedProperty("System.Photo.Orientation")) > 1) || !await fso.FileExists(path)) {
				Addons.PreviewWindow.FromFile();
			} else {
				img1.onerror = Addons.PreviewWindow.FromFile;
				img1.src = path;
			}
		}
	} else {
		img1.style.display = "none";
		div1.style.display = "none";
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
				document.getElementById("img1").src = await o.out;
			}
		};
		o.onerror = async function (o) {
			if (!await IsFolderEx(await o.path) && api.PathMatchSpec(await o.path.Path, await o.Parent.Extract)) {
				const Items = await api.CreateObject("FolderItems");
				Items.AddItem(await o.path);
				await te.OnBeforeGetData(await te.Ctrl(CTRL_FV), Items, 11);
				if (await IsExists(await o.path.Path)) {
					o.onerror = async function () {
						document.title = await MainWindow.Sync.PreviewWindow.Item.Name;
						document.getElementById("img1").style.display = "none";
						document.getElementById("desc1").innerHTML = Addons.PreviewWindow.info.join("<br>");
					}
					MainWindow.Threads.GetImage(o);
					return;
				}
			}
			document.title = await MainWindow.Sync.PreviewWindow.Item.Name;
			document.getElementById("img1").style.display = "none";
			document.getElementById("desc1").innerHTML = Addons.PreviewWindow.info.join("<br>");
		};
		MainWindow.Threads.GetImage(o);
		document.getElementById("img1").onerror = null;
	},

	Loaded: async function () {
		const desc1 = document.getElementById("desc1");
		const img = document.getElementById("img1");
		desc1.innerHTML = Addons.PreviewWindow.info.join("<br>");
		img.title = Addons.PreviewWindow.info.join("\n").replace(/<[\w\W]*>\n?/g, "");
		if (window.chrome || g_.IEVer > 8) {
			img1.style.maxHeight = "calc(100vh - " + desc1.offsetHeight + "px)";
		}
		img.style.display = "";
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
		if (!document.msFullscreenElement && !document.fullscreenElement) {
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
		}
	},

	Play: async function () {
		const div1 = document.getElementById("div1");
		const img1 = document.getElementById("img1");
		const path = await MainWindow.Sync.PreviewWindow.Item.ExtendedProperty("linktarget") || await MainWindow.Sync.PreviewWindow.Item.Path;
		if (!window.chrome && await api.PathMatchSpec(path, "*.wav")) {
			api.PlaySound(path, null, 3);
		} else {
			document.getElementById("desc1").innerHTML = "";
			if (ui_.IEVer >= 11 && await api.PathMatchSpec(path, window.chrome ? "*.mp3;*.m4a;*.wav;*.pcm;*.oga;*.flac;*.fla" : "*.mp3;*.m4a")) {
				div1.innerHTML = '<audio controls autoplay style="width: 100%"><source src="' + path + '"></audio>';
			} else {
				div1.style.height = g_.IEVer >= 8 ? "calc(100% - 5px)" : "99%";
				img1.style.display = "none";
				div1.style.display = "";
				if ((window.chrome && await api.PathMatchSpec(path, "*.mp4")) || (ui_.IEVer >= 11 && await api.PathMatchSpec(path, "*.mp4"))) {
					div1.innerHTML = '<video controls autoplay style="background-color: #000; width: 100%; max-height: 100%"><source src="' + path + '"></video>';
				} else {
					div1.innerHTML = '<embed width="100%" height="100%" src="' + path + '" autoplay="true"></embed>';
				}
			}
			div1.style.display = "";
		}
	},

	FullscreenChange: async function () {
		const hwnd = await GetTopWindow();
		const dwStyle = await api.GetWindowLongPtr(hwnd, GWL_STYLE);
		if (!Addons.PreviewWindow.rc) {
			Addons.PreviewWindow.rc = await api.Memory("RECT");
			await api.GetWindowRect(hwnd, Addons.PreviewWindow.rc);
		}
		if (document.msFullscreenElement || document.fullscreenElement) {
			await api.GetWindowRect(hwnd, Addons.PreviewWindow.rc);
			await api.SetWindowLongPtr(hwnd, GWL_STYLE, dwStyle & ~(WS_CAPTION | WS_THICKFRAME));
			const hMonitor = await api.MonitorFromRect(Addons.PreviewWindow.rc, MONITOR_DEFAULTTOPRIMARY);
			const mi = await api.Memory("MONITORINFOEX");
			await api.GetMonitorInfo(hMonitor, mi);
			rc = await mi.rcMonitor;
		} else {
			await api.SetWindowLongPtr(hwnd, GWL_STYLE, dwStyle | (WS_CAPTION | WS_THICKFRAME));
			rc = Addons.PreviewWindow.rc;
		}
		const x = await rc.left;
		const y = await rc.top;
		const w = await rc.right - x;
		const h = await rc.bottom - y;
		if (w > 0 && h > 0) {
			api.MoveWindow(hwnd, x, y, w, h, true);
		}
	},

	Init: function () {
		ApplyLang(document);
		MainWindow.Sync.PreviewWindow.Arrange()
	}
};

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

AddEventEx(document, "MSFullscreenChange", Addons.PreviewWindow.FullscreenChange);
AddEventEx(document, "webkitfullscreenchange", Addons.PreviewWindow.FullscreenChange);
