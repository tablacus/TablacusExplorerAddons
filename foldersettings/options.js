var AddonName = "FolderSettings";
var Addon_Id = AddonName.toLowerCase();
var g_Chg = { List: false };

GetCurrentSetting = async function (bForce) {
	debugger;
	var nFormat = GetNum(document.E.Format.value);
	var FV = await te.Ctrl(CTRL_FV);
	var path = await api.GetDisplayNameOf(await FV.FolderItem, (nFormat ? 0 : SHGDN_FORADDRESSBAR) | SHGDN_FORPARSING | SHGDN_FORPARSINGEX);
	var s = ["FV.CurrentViewMode(", await FV.CurrentViewMode];
	s.push(",", await FV.IconSize);
	s.push(");\n");
	s.push("FV.Columns='", await FV.GetColumns(nFormat));
	s.push("';\n");
	s.push("FV.GroupBy='", await FV.GroupBy)
	s.push("';\n");
	if ((await FV.SortColumns || "").split(/;/).length > 2 && !document.E.XP.checked && await FV.SortColumn != "System.Null") {
		s.push("FV.SortColumns='", await FV.SortColumns);
		s.push("';\n");
	} else {
		s.push("FV.SortColumn='", await FV.GetSortColumn(nFormat));
		s.push("';\n");
	}
	s = s.join("");
	if (bForce || await confirmOk([path, s].join("\n"))) {
		document.E.Filter.value = path;
		document.E.Path.value = s;
		SetType(document.E.Type, "JScript");
	}
	ChangeX("List");
}

LoadFS = async function () {
	if (!g_x.List) {
		var arFunc = await api.CreateObject("Array");
		await MainWindow.RunEvent1("AddType", arFunc);
		var oa = document.E.Type;
		var nLen = await GetLength(arFunc);
		for (var i = 0; i < nLen; ++i) {
			var o = oa[++oa.length - 1];
			var s = await arFunc[i];
			o.value = s;
			o.innerText = await GetText(s);
		}
		g_x.List = document.E.List;
		g_x.List.length = 0;
		var xml = await te.Data["xml" + AddonName];
		if (!xml) {
			xml = await OpenXml(AddonName + ".xml", false, false);
			te.Data["xml" + AddonName] = xml;
		}
		if (xml) {
			var items = await xml.getElementsByTagName("Item");
			var i = await GetLength(items);
			g_x.List.length = i;
			while (--i >= 0) {
				var item = await items[i];
				SetData(g_x.List[i], [await item.getAttribute("Filter"), await item.text, await item.getAttribute("Type")]);
			}
		}
		EnableSelectTag(g_x.List);
	}
}

SaveFS = async function () {
	if (g_Chg.List) {
		var xml = await CreateXml();
		var root = await xml.createElement("TablacusExplorer");
		var o = document.E.List;
		for (var i = 0; i < o.length; i++) {
			var item = await xml.createElement("Item");
			var a = o[i].value.split(g_sep);
			item.setAttribute("Filter", a[0]);
			item.text = a[1];
			item.setAttribute("Type", a[2]);
			await root.appendChild(item);
		}
		await xml.appendChild(root);
		await SaveXmlEx(Addon_Id + ".xml", xml);
		te.Data["xml" + AddonName] = xml;
	}
}

EditFS = function() {
	if (g_x.List.selectedIndex < 0) {
		return;
	}
	var a = g_x.List[g_x.List.selectedIndex].value.split(g_sep);
	document.E.Filter.value = a[0];
	document.E.Path.value = a[1];
	SetType(document.E.Type, a[2]);
}

ReplaceFS = function () {
	ClearX();
	if (g_x.List.selectedIndex < 0) {
		g_x.List.selectedIndex = ++g_x.List.length - 1;
		EnableSelectTag(g_x.List);
	}
	var sel = g_x.List[g_x.List.selectedIndex];
	o = document.E.Type;
	SetData(sel, [document.E.Filter.value, document.E.Path.value, o[o.selectedIndex].value]);
	g_Chg.List = true;
}

TEOk = async function () {
	if (g_Chg.Data) {
		await ReplaceFS();
	}
	await SaveFS();
}

Init1 = async function () {
	debugger;
	await ApplyLang(document);
	await LoadFS();

	if (!await WebBrowser.OnClose) {
		document.title = await GetAddonInfo(Addon_Id).Name;
		WebBrowser.OnClose = async function (WB) {
			await SetOptions(TEOk, null, ContinueOptions);
			if (g_nResult != 4) {
				WB.Close();
			}
			g_nResult = 0;
		};
		document.getElementById("_ok").style.display = "block";
		document.getElementById("_cancel").style.display = "block";
	}
	document.body.style.visibility = "";
	if (await dialogArguments.GetCurrent) {
		var bNew = true;
		var FV = await te.Ctrl(CTRL_FV);
		var FolderItem = await FV.FolderItem;
		var path = await api.GetDisplayNameOf(FolderItem, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_FORPARSINGEX);
		var path2 = await api.GetDisplayNameOf(FolderItem, SHGDN_FORPARSING | SHGDN_FORPARSINGEX);
		if (path != path2) {
			path += ";" + path2;
		}
		for (var i = g_x.List.length; i-- > 0;) {
			var a = g_x.List[i].value.split(g_sep);
			if (await api.PathMatchSpec(a[0], path)) {
				g_x.List.selectedIndex = i;
				await EditFS();
				bNew = false;
				break;
			}
		}
		if (bNew) {
			GetCurrentSetting(true);
		}
	}
}
