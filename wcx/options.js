SetTabContents(4, "", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));

Addons.WCX = {
	ConfigFile: "wcx.xml"
}

LoadFS = async function () {
	if (!g_x.List) {
		g_x.List = document.E.List;
		g_x.List.length = 0;
		const xml = await OpenXml(Addons.WCX.ConfigFile, false, false);
		if (xml) {
			const items = await xml.getElementsByTagName("Item");
			let i = await GetLength(items);
			g_x.List.length = i;
			while (--i >= 0) {
				const item = items[i];
				SetData(g_x.List[i], await Promise.all([item.getAttribute("Name"), item.getAttribute("Path"), item.getAttribute("Filter")]));
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
			const item = xml.createElement("Item");
			const a = o[i].value.split(g_sep);
			await item.setAttribute("Name", a[0]);
			await item.setAttribute("Path", a[1]);
			await item.setAttribute("Filter", a[2]);
			await root.appendChild(item);
		}
		await xml.appendChild(root);
		await SaveXmlEx(Addons.WCX.ConfigFile, xml);
	}
}

EditFS = function () {
	if (g_x.List.selectedIndex < 0) {
		return;
	}
	const a = g_x.List[g_x.List.selectedIndex].value.split(g_sep);
	document.E.Name.value = a[0];
	document.E.Path.value = a[1];
	document.E.Filter.value = a[2];
	SetProp();
}

ReplaceFS = function () {
	ClearX();
	if (g_x.List.selectedIndex < 0) {
		g_x.List.selectedIndex = ++g_x.List.length - 1;
		EnableSelectTag(g_x.List);
	}
	const sel = g_x.List[g_x.List.selectedIndex];
	o = document.E.Type;
	SetData(sel, [document.E.Name.value, document.E.Path.value, document.E.Filter.value]);
	g_Chg.List = true;
}

PathChanged = async function () {
	const res = /^(.*)64$/.exec(document.E.Path.value);
	if (res) {
		document.E.Path.value = res[1];
	}
	document.E.Name.value = await fso.GetBaseName(document.E.Path.value);
	SetProp();
}

LoadDll = async function () {
	const twcxPath = BuildPath(ui_.Installed, ["addons\\wcx\\twcx", ui_.bit, ".dll"].join(""));
	return {
		X: await api.DllGetClassObject(twcxPath, "{56297D71-E778-4dfd-8678-6F4079A2BC50}"),
		Path: ((await ExtractPath(te, document.E.Path.value)) + (ui_.bit > 32 ? "64" : "")).replace(/\.u(wcx64)$/, ".$1"),
		WCXPATH: twcxPath
	};
}

SetProp = async function () {
	debugger;
	let WCX;
	const DLL = await LoadDll();
	if (DLL.X) {
		WCX = await DLL.X.Open(DLL.Path) || {};
	}
	if (!WCX) {
		return;
	}
	const arProp = ["IsUnicode", "OpenArchive", "ReadHeaderEx", "ProcessFile", "CloseArchive", "PackFiles", "DeleteFiles", "CanYouHandleThisFile", "ConfigurePacker", "SetChangeVolProc", "SetProcessDataProc", "PackSetDefaultParams"];
	const arHtml = [[], [], [], []];
	for (let i in arProp) {
		arHtml[i % 2].push('<div style="white-space: nowrap"><input type="checkbox" ', await WCX[arProp[i]] ? "checked" : "", ' onclick="return false;">', arProp[i].replace(/^Is/, ""), '</div>');
	}
	arHtml[2].push(await GetTextR('64-bit'), '<br><input type="text" value="', EncodeSC(await ExtractPath(te, document.E.Path.value) + "64").replace(/\.u(wcx64)$/, ".$1"), '" style="width: 100%" readonly><br>');
	for (let i = 3; i--;) {
		document.getElementById("prop" + i).innerHTML = arHtml[i].join("");
	}
	const ar = [GetFileName(DLL.Path)];
	try {
		const s = await fso.GetFileVersion(DLL.Path);
		if (s) {
			ar.push("Ver. " + s);
		}
	} catch (e) { }
	document.getElementById("ver").innerHTML = ar.join(" ");
}

ConfigDialog = async function () {
	const DLL = await LoadDll();
	if (!DLL.X) {
		MessageBox((await api.LoadString(hShell32, 8720)).replace(/%1[!ls]*/, DLL.WCXPATH), TITLE, MB_OK);
		return;
	}
	const WCX = DLL.X.Open(DLL.Path);
	if (!WCX) {
		if (DLL.Path) {
			MessageBox((await api.LoadString(hShell32, 8720)).replace(/%1[!ls]*/, DLL.Path), TITLE, MB_OK);
		}
		return;
	}
	WCX.ConfigurePacker(await api.GetWindowLongPtr(await WebBrowser.hwnd, GWLP_HWNDPARENT));
}

SaveLocation = async function () {
	if (g_bChanged) {
		ReplaceFS();
	}
	if (g_Chg.List) {
		await SaveFS();
	}
};

setTimeout(function () {
	LoadFS();
	document.getElementById("_browse1").onclick = async function () {
		const s = '*.wcx;*.uwcx;*.wcx64';
		RefX('Path', 0, 0, 1, await GetAddonInfo(Addon_Id).Name + '(' + s + ')|' + s);
	}
	if (document.documentMode >= 9) {
		document.getElementById("pane").style.height = "calc(100vh - 8em)";
	}
}, 99);
