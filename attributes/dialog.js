RunEventUI("BrowserCreatedEx");

arAttrib = [FILE_ATTRIBUTE_READONLY, FILE_ATTRIBUTE_HIDDEN, FILE_ATTRIBUTE_SYSTEM, FILE_ATTRIBUTE_ARCHIVE];
arStr = ["R", "H", "S", "A"];
Promise.all([GetTextR("@shell32.dll,-8768"), GetTextR("@shell32.dll,-8769"), GetTextR("@shell32.dll,-8770"), GetTextR("@DscCoreConfProv.dll,-32[Archive]")]).then(function (r) {
	arHelp = r;
});
cItems = [];

Resize = function () {
	CalcElementHeight(document.getElementById("P"), 3);
	return false;
}

CheckAll = function (e) {
	const o = e ? e.currentTarget : window.event.srcElement;
	for (let i in cItems) {
		cItems[i].ckbx[o.value].checked = o.checked;
	}
}

SetAttributes = async function () {
	let filter = 0;
	for (let j in arAttrib) {
		filter |= arAttrib[j];
	}
	for (let i in cItems) {
		let attr = 0;
		for (let j in arAttrib) {
			attr |= cItems[i].ckbx[j].checked ? arAttrib[j] : 0;
		}
		if ((cItems[i].Attributes ^ attr) & filter) {
			attr |= cItems[i].Attributes & (~filter);
			if (!await SetFileAttributes(cItems[i].Path, attr)) {
				MessageBox((await api.LoadString(hShell32, 4228)).replace(/\t|\(%d\)/g, "") + "\n" + cItems[i].Path, TITLE, MB_ICONEXCLAMATION);
			}
		}
	}
	CloseWindow();
}

InitDialog = async function () {
	ApplyLang(document);
	const FV = await te.Ctrl(CTRL_FV);
	if (FV) {
		let Selected = await FV.SelectedItems();
		if (Selected) {
			if (window.chrome) {
				Selected = await api.CreateObject("SafeArray", Selected);
			}
			const table = document.getElementById("T");
			let tr = document.createElement('tr');
			tr.className = "oddline";
			let td = document.createElement('td');
			td.innerText = await GetTextR("@shell32.dll,-8976");
			td.style.width = "100%";
			td.style.verticalAlign = "middle";
			td.style.paddingLeft = "8px";
			tr.appendChild(td);
			for (let i in arStr) {
				td = document.createElement('th');
				td.innerText = arStr[i];
				td.title = arHelp[i];
				if (Selected.length > 1) {
					const input = document.createElement('input');
					input.type = "checkbox";
					input.value = i;
					input.onclick = CheckAll;
					td.appendChild(input);
				}
				tr.appendChild(td);
			}
			table.appendChild(tr);
			const wfd = await api.Memory("WIN32_FIND_DATA");
			const wfdSize = await wfd.Size;
			for (let i = 0; i < Selected.length; i++) {
				tr = document.createElement('tr');
				if (i & 1) {
					tr.className = "oddline";
				}
				td = document.createElement('td');
				const Item = Selected[i];
				if (await api.SHGetDataFromIDList(Item, SHGDFIL_FINDDATA, wfd, wfdSize) == S_OK) {
					oItem = {};
					oItem.Path = await Item.Path;
					const attr = await wfd.dwFileAttributes;
					oItem.Attributes = attr;
					td.innerText = await wfd.cFileName;
					td.style.paddingLeft = "8px";
					tr.appendChild(td);
					oItem.ckbx = [];
					for (let j = 0; j < arStr.length; j++) {
						td = document.createElement('th');
						const input = document.createElement('input');
						input.type = "checkbox";
						input.checked = (attr & arAttrib[j]);
						oItem.ckbx[j] = input;
						td.appendChild(input);
						td.title = arHelp[j];
						tr.appendChild(td);
					}
					table.appendChild(tr);
					cItems.push(oItem);
				}
			}
		}
	}
	Resize();
	document.body.style.visibility = "";
};

AddEventEx(window, "resize", Resize);

AddEventEx(document.body, "keydown", function (e) {
	if (e.keyCode == VK_ESCAPE || /^Esc/i.test(e.key)) {
		CloseWindow();
	}
	return true;
});
