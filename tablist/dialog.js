RunEventUI("BrowserCreatedEx");

Addons.TabList = {
	NextPane: async function (TC) {
	},

	Changed: async function () {
		clearTimeout(Addons.TabList.tid);
		Addons.TabList.Exists = {};
		document.getElementById("P").innerHTML = "";
		const cTC = await te.Ctrls(CTRL_TC, true, window.chrome);
		let TC = await te.Ctrl(CTRL_TC);
		const table = document.createElement("table");
		table.style.width = "100%";
		await Addons.TabList.ShowTabList(TC, table);
		for (let i = 0; i < cTC.length; i++) {
			TC = await Addons.TabList.NextPane(TC) || cTC[i];
			await Addons.TabList.ShowTabList(TC, table);
		}
		document.getElementById("P").appendChild(table);
	},

	ShowTabList: async function (TC, table) {
		if (TC) {
			const Id = await TC.Id;
			if (Addons.TabList.Exists[Id]) {
				return;
			}
			Addons.TabList.Exists[Id] = true;
			const nCount = await TC.Count;
			let nItem = 0;
			let s = document.F.filter.value;
			if (Addons.TabList.RE && !/^\*|\//.test(s)) {
				s = "/" + s + "/i";
			} else {
				if (!/^\//.test(s)) {
					const ar = s.split(/;/);
					for (let i in ar) {
						const res = /^([^\*\?]+)$/.exec(ar[i]);
						if (res) {
							ar[i] = "*" + res[1] + "*";
						}
					}
					s = ar.join(";");
				}
			}
			if (!s) {
				s = "*";
			}
			for (let i = 0; i < nCount; i++) {
				const FV = await TC[i];
				const p = await Promise.all([MainWindow.GetTabName(FV), FV.FolderItem.Path, MainWindow.RunEvent4("GetTabColor", FV)]);
				if (!await MainWindow.PathMatchEx(GetFileName(p[1]), s)) {
					continue;
				}
				if (!nItem++) {
					const tr = document.createElement('tr');
					const ar = await Promise.all([GetText("Name"), GetText("Path")]);
					for (let i = 0; i < ar.length; ++i) {
						tr.className = "text1";
						const td = document.createElement('td');
						td.style = "padding-left: 6pt; white-space: nowrap;";
						tr.appendChild(td);
						td.innerHTML = ar[i];
					}
					table.appendChild(tr);
				}
				const tr = document.createElement('tr');
				for (let j = 2; j--;) {
					const td = document.createElement('td');
					td.style.whiteSpace = "nowrap";
					td.style.paddingLeft = "8px";
					td.style.paddingRight = "8px";
					tr.appendChild(td);
				}
				tr.style.cursor = "pointer";
				tr.onclick = Addons.TabList.Click;
				tr.oncontextmenu = Addons.TabList.Popup;
				table.appendChild(tr);
				tr.className = nItem & 1 ? "tab" : "tab oddline";
				tr.id = "t" + i + "_" + Id;
				const td = tr.cells[0];
				td.id = "n" + i + "_" + Id;
				td.innerText = p[0];
				const cl = p[2];
				if (/^#/.test(cl)) {
					let c = Number(cl.replace(/^#/, "0x"));
					c = (c & 0xff0000) * .0045623779296875 + (c & 0xff00) * 2.29296875 + (c & 0xff) * 114;
					td.style.color = c > 127000 ? "#000" : "#fff";
					td.style.backgroundColor = cl;
				} else {
					td.style.color = "";
					td.style.backgroundColor = "";
				}
				tr.cells[1].innerText = p[1];
				tr.cells[1].id = "p" + i + "_" + Id;
			}
		}
	},

	Click: async function (ev, Id) {
		const el = (ev || event).srcElement;
		const ar = el.id.split(/\D+/);
		const TC = await te.Ctrl(CTRL_TC, ar[2]);
		TC.SelectedIndex = ar[1];
		(await TC.Selected).Focus();
	},

	Popup: async function (ev, Id) {
		const el = (ev || event).srcElement;
		const ar = el.id.split(/\D+/);
		const pt = await api.CreateObject("Object");
		pt.x = ev.screenX * ui_.Zoom;
		pt.y = ev.screenY * ui_.Zoom;
		const TC = await te.Ctrl(CTRL_TC, ar[2]);
		pt.Target = await TC[ar[1]];
		te.OnShowContextMenu(TC, await TC.hwnd, WM_CONTEXTMENU, 0, pt);
		return false;
	},

	KeyDown: function (ev) {
		const k = ev.keyCode;
		if (k != VK_PROCESSKEY) {
			clearTimeout(Addons.TabList.tid);
			if (k == VK_RETURN) {
				Addons.TabList.Changed();
				return false;
			} else {
				Addons.TabList.tid = setTimeout(Addons.TabList.Changed, 500);
			}
		}
	},

	Resize: async function () {
		CalcElementHeight(document.getElementById("P"), 2);
		const hwnd = await GetTopWindow();
		if (await api.IsZoomed(hwnd) || await api.IsIconic(hwnd)) {
			return;
		}
		MainWindow.Common.TabList.width = document.body.offsetWidth * 96 / screen.deviceYDPI;
		MainWindow.Common.TabList.height = document.body.offsetHeight * 96 / screen.deviceYDPI;
	}
}

InitDialog = async function () {
	ApplyLang(document);
	Addons.TabList.SwitchPane = await api.ObjGetI(await MainWindow.Sync, "SwitchPane");
	if (await Addons.TabList.SwitchPane) {
		Addons.TabList.NextPane = async function (TC) {
			return Addons.TabList.SwitchPane.NextFV(await TC.Selected).Parent;
		}
	}
	await Addons.TabList.Changed();
	Addons.TabList.Resize();
	document.body.style.visibility = "";
	WebBrowser.Focus();
	document.F.filter.focus();
	WebBrowser.OnClose = async function (WB) {
		const hwnd = await GetTopWindow();
		if (!await api.IsZoomed(hwnd) && !await api.IsIconic(hwnd)) {
			const rc = await api.Memory("RECT");
			await api.GetWindowRect(hwnd, rc);
			let r = await Promise.all([MainWindow.Common.TabList.left, rc.left, MainWindow.Common.TabList.top, rc.top]);
			if (MainWindow.Common.TabList.left != r[1] || MainWindow.Common.TabList.top != r[3]) {
				MainWindow.Common.TabList.left = r[1];
				MainWindow.Common.TabList.top = r[3];
				const ar = ["width", "height", "top", "left"];
				for (let i = 0; i < ar.length; ++i) {
					r[i] = MainWindow.Common.TabList[ar[i]];
				}
				r = await Promise.all(r);
				const db = {};
				for (let i = 0; i < ar.length; ++i) {
					db[ar[i]] = r[i];
				}
				WriteTextFile(BuildPath(await te.Data.DataFolder, "config\\tablist.json"), JSON.stringify(db));
			}
		}
		MainWindow.InvokeUI("Addons.TabList.Close");
		WebBrowser.Close();
	};
}

AddEventEx(window, "resize", Addons.TabList.Resize);

AddEventEx(document.body, "keydown", function (e) {
	if (e.keyCode == VK_ESCAPE || /^Esc/i.test(e.key)) {
		CloseWindow();
	}
	return true;
});
