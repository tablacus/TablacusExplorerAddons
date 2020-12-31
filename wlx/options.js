SetTabContents(4, "General", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));

LoadLS = async function () {
	if (!g_x.List) {
		g_x.List = document.E.List;
		g_x.List.length = 0;
		const xml = await OpenXml(Addon_Id + ".xml", false, false);
		if (xml) {
			const items = await xml.getElementsByTagName("Item");
			let i = await GetLength(items);
			alert(i);
			g_x.List.length = i;
			while (--i >= 0) {
				const item = await items[i];
				SetData(g_x.List[i], await Promise.all([item.getAttribute("Name"), item.getAttribute("Path"), item.getAttribute("Fit")]));
			}
		}
		EnableSelectTag(g_x.List);
	}
}

EditLS = function () {
	if (g_x.List.selectedIndex < 0) {
		return;
	}
	const a = g_x.List[g_x.List.selectedIndex].value.split(g_sep);
	document.E.Name.value = a[0];
	document.E.Path.value = a[1];
	document.E.Fit.checked = a[2];
	SetProp();
}

ReplaceLS = function () {
	ClearX();
	if (g_x.List.selectedIndex < 0) {
		g_x.List.selectedIndex = ++g_x.List.length - 1;
		EnableSelectTag(g_x.List);
	}
	var sel = g_x.List[g_x.List.selectedIndex];
	o = document.E.Type;
	SetData(sel, [document.E.Name.value, document.E.Path.value, document.E.Fit.checked]);
	g_Chg.List = true;
}

PathChanged = function () {
	const re = /^(.*)64$/.exec(document.E.Path.value);
	if (re) {
		document.E.Path.value = re[1];
	}
	SetProp(true);
}

SetProp = async function (bName) {
	const dllPath = (await ExtractPath(te, document.E.Path.value) + (ui_.bit != 32 ? "64" : "")).replace(/\.u(wlx64)$/, ".$1");
	const twlxPath = BuildPath(ui_.Installed, ["addons\\wlx\\twlx", ui_.bit, ".dll"].join(""));

	const DLL = await api.DllGetClassObject(twlxPath, "{E160213A-4E9E-44f3-BD39-8297499608B6}");
	const WLX = (DLL ? await DLL.Open(dllPath) : {}) || {};
	if (bName) {
		document.E.Name.value = await fso.GetBaseName(document.E.Path.value);
	}
	const arProp = ["IsUnicode", "ListLoad", "ListLoadNext", "ListCloseWindow", "ListGetDetectString", "ListSetDefaultParams", "ListGetPreviewBitmap"];
	const arHtml = [[], [], [], []];
	for (let i in arProp) {
		arHtml[i % 2].push('<div style="white-space: nowrap"><input type="checkbox" ', await WLX[arProp[i]] ? "checked" : "", ' onclick="return false;">', arProp[i].replace(/^Is/, ""), '</div>');
	}
	arHtml[2].push(await GetTextR('64-bit'), '<br><input type="text" value="', (await ExtractPath(te, document.E.Path.value) + "64").replace(/\.u(wlx64)$/, ".$1").replace(/"/g, "&quot;"), '" style="width: 100%" readonly><br>');
	if (await WLX.ListGetDetectString) {
		arHtml[3].push(EncodeSC(await WLX.ListGetDetectString()));
	}
	for (let i = arHtml.length; i--;) {
		document.getElementById("prop" + i).innerHTML = arHtml[i].join("");
	}
	const ar = [await fso.GetFileName(dllPath)];
	try {
		const s = await fso.GetFileVersion(dllPath);
		if (s) {
			ar.push("Ver. " + s);
		}
	} catch (e) { }
	document.getElementById("ver").innerHTML = ar.join(" ");
}

SaveLocation = async function () {
	if (g_bChanged) {
		ReplaceLS();
	}
	if (g_Chg.List) {
		const xml = CreateXml();
		const root = xml.createElement("TablacusExplorer");
		const o = document.E.List;
		for (let i = 0; i < o.length; i++) {
			const item = xml.createElement("Item");
			const a = o[i].value.split(g_sep);
			await item.setAttribute("Name", a[0]);
			await item.setAttribute("Path", a[1]);
			await item.setAttribute("Fit", a[2]);
			await root.appendChild(item);
		}
		await xml.appendChild(root);
		await SaveXmlEx(Addon_Id + ".xml", xml);
	}
}

setTimeout(function () {
	document.getElementById("_browse1").onclick = async function () {
		const s = '*.wlx;*.uwlx;*.wlx64';
		RefX('Path', 0, 0, 1, await GetAddonInfo(Addon_Id).Name + '(' + s + ')|' + s);
	}
	SetOnChangeHandler();
	LoadLS();
	if (document.documentMode >= 9) {
		document.getElementById("pane").style.height = "calc(100vh - 8em)";
	}
}, 99);
