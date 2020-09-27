var Addon_Id = "attributes";

var item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "Context");
	item.setAttribute("MenuPos", 1);

	item.setAttribute("KeyOn", "List");
	item.setAttribute("MouseOn", "List");
}

if (window.Addon == 1) {
	Addons.Attributes =
	{
		strName: item.getAttribute("MenuName") || GetText("Attributes..."),
		Exec: function (Ctrl) {
			var Selected = GetSelectedArray(Ctrl, pt, true).shift();
			if (Selected && Selected.Count) {
				var h = 110 + 26 * Selected.Count;
				if (h > 480) {
					h = 480;
				}
				ShowDialog("../addons/attributes/dialog.html", { MainWindow: window, width: 640, height: h });
			}
		}
	}

	//Menu
	if (item.getAttribute("MenuExec")) {
		Addons.Attributes.nPos = api.LowPart(item.getAttribute("MenuPos"));
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos, Selected, item) {
			if (item && item.IsFileSystem) {
				api.InsertMenu(hMenu, Addons.Attributes.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Addons.Attributes.strName);
				ExtraMenuCommand[nPos] = Addons.Attributes.Exec;
			}
			return nPos;
		});
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.Attributes.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.Attributes.Exec, "Func");
	}

	AddTypeEx("Add-ons", "Attributes...", Addons.Attributes.Exec);
}
if (window.Addon == 2) {
	MainWindow.RunEvent1("BrowserCreated", document);

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

	SetAttributes = function () {
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
				if (!SetFileAttributes(cItems[i].Path, attr)) {
					MessageBox(api.LoadString(hShell32, 4228).replace(/\t|\(%d\)/g, "") + "\n" + cItems[i].Path, TITLE, MB_ICONEXCLAMATION);
				}
			}
		}
		window.close();
	}

	AddEventEx(window, "load", function () {
		ApplyLang(document);
		var FV = te.Ctrl(CTRL_FV);
		if (FV) {
			Selected = FV.SelectedItems();
			if (Selected) {
				var table = document.getElementById("T");
				var nSelected = Selected.Count;

				var tr = document.createElement('tr');
				tr.className = "oddline";
				var td = document.createElement('td');
				td.innerText = GetText("Name");
				td.style.width = "100%";
				td.style.verticalAlign = "middle";
				td.style.paddingLeft = "8px";
				tr.appendChild(td);
				for (var i in arStr) {
					var td = document.createElement('th');
					td.innerText = arStr[i];
					td.title = GetText(arHelp[i]);
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
					var Item = Selected.Item(i);
					var wfd = api.Memory("WIN32_FIND_DATA");
					if (api.SHGetDataFromIDList(Item, SHGDFIL_FINDDATA, wfd, wfd.Size) == S_OK) {
						oItem = {};
						oItem.Path = Item.Path;
						var attr = wfd.dwFileAttributes;
						oItem.Attributes = attr;
						td.innerText = wfd.cFileName;
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
							td.title = GetText(arHelp[j]);
							tr.appendChild(td);
						}
						table.appendChild(tr);
						cItems.push(oItem);
					}
				}
			}
		}
		Resize();
	});

	AddEventEx(window, "resize", Resize);

	AddEventEx(document.body, "keydown", function (e) {
		var key = (e || event).keyCode;
		if (key == VK_ESCAPE) {
			window.close();
		}
		return true;
	});
}
