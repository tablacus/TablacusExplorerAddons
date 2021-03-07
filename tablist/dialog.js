
let g_TC = {};
let g_tid;
let g_RE;

RunEventUI("BrowserCreatedEx");

TabListChanged = async function () {
	const TC = await te.Ctrl(CTRL_TC);
	if (TC) {
		g_TC = TC;
		const table = document.getElementById("T");
		const nCount = await TC.Count;
		let nItem = 0;
		let s = document.F.filter.value;
		if (g_RE && !/^\*|\//.test(s)) {
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
			if (!await MainWindow.PathMatchEx(p[1], s)) {
				continue;
			}
			if (++nItem >= table.rows.length - 1) {
				const tr = document.createElement('tr');
				for (let j = 2; j--;) {
					const td = document.createElement('td');
					td.style.whiteSpace = "nowrap";
					td.style.paddingLeft = "8px";
					td.style.paddingRight = "8px";
					tr.appendChild(td);
				}
				tr.style.cursor = "pointer";
				tr.onclick = Click1;
				tr.oncontextmenu = Popup1;
				table.appendChild(tr);
			}
			const tr = table.rows[nItem];
			tr.className = nItem & 1 ? "tab" : "tab oddline";
			tr.id = "t" + i;
			const td = tr.cells[0];
			td.id = "n" + i;
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
			tr.cells[1].id = "p" + i;
		}
		while (table.rows.length > nItem + 1) {
			table.deleteRow(table.rows.length - 1);
		}
	}
}

Resize = function () {
	CalcElementHeight(document.getElementById("P"), 2);
	return false;
}

InitDialog = async function () {
	ApplyLang(document);
	await TabListChanged();
	Resize();
	document.body.style.visibility = "";
	WebBrowser.OnClose = async function (WB) {
		MainWindow.InvokeUI("Addons.TabList.Close");
		WebBrowser.Close();
	};
}

Click1 = async function (ev) {
	const el = (ev || event).srcElement;
	g_TC.SelectedIndex = el.id.replace(/\D+/, "");
}

Popup1 = async function (ev) {
	const el = (ev || event).srcElement;
	const pt = await api.CreateObject("Object");
	pt.x = ev.screenX * ui_.Zoom;
	pt.y = ev.screenY * ui_.Zoom,
	pt.Target = await g_TC[el.id.replace(/\D+/, "")];
	te.OnShowContextMenu(g_TC, await g_TC.hwnd, WM_CONTEXTMENU, 0, pt);
	return false;
}

KeyDown1 = function (ev) {
	const k = ev.keyCode;
	if (k != VK_PROCESSKEY) {
		clearTimeout(g_tid);
		if (k == VK_RETURN) {
			TabListChanged();
			return false;
		} else {
			g_tid = setTimeout(TabListChanged, 500);
		}
	}
},

AddEventEx(window, "resize", Resize);

AddEventEx(document.body, "keydown", function (e) {
	if (e.keyCode == VK_ESCAPE || /^Esc/i.test(e.key)) {
		CloseWindow();
	}
	return true;
});
