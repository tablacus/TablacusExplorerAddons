RunEventUI("BrowserCreatedEx");

arAttrib = [FILE_ATTRIBUTE_READONLY, FILE_ATTRIBUTE_HIDDEN, FILE_ATTRIBUTE_SYSTEM, FILE_ATTRIBUTE_ARCHIVE];
arStr = ["R", "H", "S", "A"];
arHelp = ["Read Only", "Hidden", "System", "Archive"];
cItems = [];

Resize = function () {
	CalcElementHeight(document.getElementById("P"), 3);
	return false;
}

CheckAll = function (e) {
	var o = e ? e.currentTarget : window.event.srcElement;
	for (var i in cItems) {
		cItems[i].ckbx[o.value].checked = o.checked;
	}
}

SetAttributes = async function () {
	var filter = 0;
	for (var j in arAttrib) {
		filter |= arAttrib[j];
	}
	for (var i in cItems) {
		var attr = 0;
		for (var j in arAttrib) {
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
	var FV = await te.Ctrl(CTRL_FV);
	if (FV) {
		Selected = await FV.SelectedItems();
		if (Selected) {
			var table = document.getElementById("T");
			var nSelected = await Selected.Count;
			var tr = document.createElement('tr');
			tr.className = "oddline";
			var td = document.createElement('td');
			td.innerText = await GetText("Name");
			td.style.width = "100%";
			td.style.verticalAlign = "middle";
			td.style.paddingLeft = "8px";
			tr.appendChild(td);
			for (var i in arStr) {
				var td = document.createElement('th');
				td.innerText = arStr[i];
				td.title = await GetText(arHelp[i]);
				if (nSelected > 1) {
					var input = document.createElement('input');
					input.type = "checkbox";
					input.value = i;
					input.onclick = CheckAll;
					td.appendChild(input);
				}
				tr.appendChild(td);
			}
			table.appendChild(tr);
			for (i = 0; i < nSelected; i++) {
				tr = document.createElement('tr');
				if (i & 1) {
					tr.className = "oddline";
				}
				td = document.createElement('td');
				var Item = await Selected.Item(i);
				var wfd = await api.Memory("WIN32_FIND_DATA");
				if (await api.SHGetDataFromIDList(Item, SHGDFIL_FINDDATA, wfd, await wfd.Size) == S_OK) {
					oItem = {};
					oItem.Path = await Item.Path;
					var attr = await wfd.dwFileAttributes;
					oItem.Attributes = attr;
					td.innerText = await wfd.cFileName;
					td.style.paddingLeft = "8px";
					tr.appendChild(td);
					oItem.ckbx = [];
					for (var j = 0; j < 4; j++) {
						td = document.createElement('th');
						var input = document.createElement('input');
						input.type = "checkbox";
						input.checked = (attr & arAttrib[j]);
						oItem.ckbx[j] = input;
						td.appendChild(input);
						td.title = await GetText(arHelp[j]);
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
