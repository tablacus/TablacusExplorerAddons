const AddonName = "FolderSettings";
const Addon_Id = AddonName.toLowerCase();
const g_Chg = { List: false };

GetCurrentSetting = async function (bForce) {
	const nFormat = GetNum(document.E.Format.value);
	const FV = await te.Ctrl(CTRL_FV);
	const r = await Promise.all([api.GetDisplayNameOf(FV, (nFormat ? 0 : SHGDN_FORADDRESSBAR) | SHGDN_FORPARSING | SHGDN_FORPARSINGEX), FV.CurrentViewMode, FV.IconSize, FV.GetColumns(nFormat), FV.GroupBy, FV.SortColumns, FV.SortColumn, FV.GetSortColumn(nFormat)]);
	const path = r[0];
	let s = ["FV.SetViewMode(", r[1], ",", r[2], ");\n"];
	s.push("FV.Columns='", r[3], "';\n");
	s.push("FV.GroupBy='", r[4], "';\n");
	if ((r[5] || "").split(/;/).length > 2 && !document.E.XP.checked && r[6] != "System.Null") {
		s.push("FV.SortColumns='", r[5], "';\n");
	} else {
		s.push("FV.SortColumn='", r[7], "';\n");
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
		let arFunc = await api.CreateObject("Array");
		await MainWindow.RunEvent1("AddType", arFunc);
		const oa = document.E.Type;
		if (window.chrome) {
			arFunc = await api.CreateObject("SafeArray", arFunc);
		}
		for (let i = 0; i < arFunc.length; ++i) {
			const o = oa[++oa.length - 1];
			const s = arFunc[i];
			o.value = s;
			o.innerText = await GetText(s);
		}
		g_x.List = document.E.List;
		g_x.List.length = 0;
		let xml = await te.Data["xml" + AddonName];
		if (!xml) {
			xml = await OpenXml(AddonName + ".xml", false, false);
			te.Data["xml" + AddonName] = xml;
		}
		if (xml) {
			const items = await GetXmlItems(await xml.getElementsByTagName("Item"));
			let i = items.length;
			g_x.List.length = i;
			while (--i >= 0) {
				const item = items[i];
				SetData(g_x.List[i], [item.Filter, item.text, item.Type]);
			}
		}
		EnableSelectTag(g_x.List);
	}
}

SaveFS = async function () {
	if (g_Chg.List) {
		const xml = await CreateXml();
		const root = await xml.createElement("TablacusExplorer");
		const o = document.E.List;
		for (let i = 0; i < o.length; i++) {
			const item = await xml.createElement("Item");
			const a = o[i].value.split(g_sep);
			await item.setAttribute("Filter", a[0]);
			item.text = a[1];
			await item.setAttribute("Type", a[2]);
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
	const a = g_x.List[g_x.List.selectedIndex].value.split(g_sep);
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
	const sel = g_x.List[g_x.List.selectedIndex];
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
		let bNew = true;
		const FV = await te.Ctrl(CTRL_FV);
		let path = await api.GetDisplayNameOf(FV, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_FORPARSINGEX);
		const path2 = await api.GetDisplayNameOf(FV, SHGDN_FORPARSING | SHGDN_FORPARSINGEX);
		if (path != path2) {
			path += ";" + path2;
		}
		for (let i = g_x.List.length; i-- > 0;) {
			const a = g_x.List[i].value.split(g_sep);
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
