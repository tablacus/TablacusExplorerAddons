var Addon_Id = "attributes";

(function () {
	var items = te.Data.Addons.getElementsByTagName(Addon_Id);
	if (items.length) {
		var item = items[0];
		if (!item.getAttribute("Set")) {
			item.setAttribute("MenuExec", 1);
			item.setAttribute("Menu", "Context");
			item.setAttribute("MenuPos", 1);
			item.setAttribute("MenuName", "Attributes...");

			item.setAttribute("KeyOn", "List");
			item.setAttribute("MouseOn", "List");
		}
	}
	if (window.Addon == 1) {
		Addons.Attributes =
		{
			Exec: function (Ctrl)
			{
				if (!Ctrl) {
					Ctrl = te.Ctrl(CTRL_FV);
				}
				var Selected = Ctrl.SelectedItems();
				if (Selected && Selected.Count) {
					var h = 100 + 26 * Selected.Count;
					if (h > 480) {
						h = 480;
					}
					showModelessDialog("../addons/attributes/dialog.html", window, "dialogWidth: 640px; dialogHeight: " + h + "px; resizable: yes; status: 0");
				}
			}
		}

		if (items.length) {
			var s = item.getAttribute("MenuName");
			if (s && s != "") {
				Addons.Attributes.strName = GetText(s);
			}
			//Menu
			if (item.getAttribute("MenuExec")) {
				Addons.Attributes.nPos = api.LowPart(item.getAttribute("MenuPos"));
				AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
				{
					var Selected = Ctrl.SelectedItems();
					if (Selected && Selected.Count) {
						var item = Selected.Item(0);
						if (item.IsFileSystem) {
							api.InsertMenu(hMenu, Addons.Attributes.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Addons.Attributes.strName);
							ExtraMenuCommand[nPos] = Addons.Attributes.Exec;
						}
					}
					return nPos;
				});
			}
			//Key
			if (item.getAttribute("KeyExec")) {
				SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), "Addons.Attributes.Exec();", "JScript");
			}
			//Mouse
			if (item.getAttribute("MouseExec")) {
				SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), "Addons.Attributes.Exec();", "JScript");
			}

			AddTypeEx("Add-ons", "Attributes...", Addons.Attributes.Exec);
		}
	}
	if (window.Addon == 2) {
		arAttrib = [FILE_ATTRIBUTE_READONLY, FILE_ATTRIBUTE_HIDDEN, FILE_ATTRIBUTE_SYSTEM, FILE_ATTRIBUTE_ARCHIVE];
		arStr = ["R", "H", "S", "A"];
		arHelp = ["Read Only", "Hidden", "System", "Archive"];
		cItems = [];

		Resize = function ()
		{
			var w = (document.documentElement.clientWidth || document.body.clientWidth) + "px";
			var h = document.documentElement.clientHeight || document.body.clientHeight;
			var o = document.getElementById("P");
			h -= 36;
			if (h > 0) {
				o.style.height = h + 'px';
			}
			o.style.width = w;
			document.F.style.width = w;
			document.getElementById("R").style.width = w;
			return false;
		}

		CheckAll = function (e)
		{
			var o = e ? e.currentTarget : window.event.srcElement;
			for (var i in arCheckbox) {
				arCheckbox[i][o.value].checked = o.checked;
			}
		}

		SetAttributes = function ()
		{
			var filter = 0;
			for (var j in arAttrib) {
				filter |= arAttrib[j];
			}
			for (var i in arCheckbox) {
				var attr = 0;
				for (var j in arAttrib) {
					attr |= arCheckbox[i][j].checked ? arAttrib[j] : 0;
				}
				if ((cItems[i].Attributes ^ attr) & filter) {
					attr |= cItems[i].Attributes & (~filter);
					try {
						cItems[i].Attributes = attr;
					}
					catch (e) {
						wsh.Popup(e.description + "\n" + cItems[i].Path, 0, TITLE, MB_ICONEXCLAMATION);
					}
				}
			}
			window.close();
		}

		AddEventEx(window, "load", function ()
		{
			ApplyLang(document);
			var FV = te.Ctrl(CTRL_FV);
			if (FV) {
				Selected = FV.SelectedItems();
				if (Selected) {
					var table = document.getElementById("T");
					var nSelected = Selected.Count;
					arCheckbox = [];

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
						var Item;
						try {
							Item = fso.GetFile(Selected.Item(i).Path);
						}
						catch (e) {
							try {
								Item = fso.GetFolder(Selected.Item(i).Path);
							}
							catch (e) {
								Item = null;
							}
						}
						if (Item) {
							cItems[i] = Item;
						}
						var attr = Item.Attributes;
						td.innerText = Selected.Item(i).Name;
						td.style.paddingLeft = "8px";
						tr.appendChild(td);

						arCheckbox[i] = [];
						for (var j = 0; j < 4; j++) {
							td = document.createElement('th');
							var input = document.createElement('input');
							input.type="checkbox";
							input.checked= (attr & arAttrib[j]);
							arCheckbox[i][j] = input;
							td.appendChild(input);
							td.title = GetText(arHelp[j]);
							tr.appendChild(td);
						}
						table.appendChild(tr);
					}
				}
			}
			Resize();
		});

		AddEventEx(window, "resize", Resize);
	}
})();
