const Addon_Id = "spi";
g_Chg = { List: false, Data: "List" };

SetTabContents(4, "", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));

LoadFS = async function () {
	if (!g_x.List) {
		g_x.List = document.E.List;
		g_x.List.length = 0;
		const xml = await OpenXml(Addon_Id + ui_.bit + ".xml", false, false);
		if (xml) {
			const items = await xml.getElementsByTagName("Item");
			let i = await GetLength(items);
			g_x.List.length = i;
			while (--i >= 0) {
				const item = await items[i];
				const r = await Promise.all([item.getAttribute("Name"), item.getAttribute("Path"), item.getAttribute("Disabled"), item.getAttribute("Filter"), item.getAttribute("Preview"), item.getAttribute("IsPreview"), item.getAttribute("UserFilter"), item.getAttribute("Sync"), item.getAttribute("Ansi")]);
				SetData(g_x.List[i], r, !await item.getAttribute("Disabled"));
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
			item.setAttribute("Name", a[0]);
			item.setAttribute("Path", a[1]);
			item.setAttribute("Disabled", a[2]);
			item.setAttribute("Filter", a[3]);
			item.setAttribute("Preview", a[4]);
			item.setAttribute("IsPreview", a[5]);
			item.setAttribute("UserFilter", a[6]);
			item.setAttribute("Sync", a[7]);
			item.setAttribute("Ansi", a[8]);
			root.appendChild(item);
		}
		await xml.appendChild(root);
		await SaveXmlEx(Addon_Id + ui_.bit + ".xml", xml);
	}
}

EditFS = function () {
	if (g_x.List.selectedIndex < 0) {
		return;
	}
	const a = g_x.List[g_x.List.selectedIndex].value.split(g_sep);
	document.E.Name.value = a[0];
	document.E.Path.value = a[1];
	document.E.Enable.checked = !a[2];
	document.E.Filter.checked = a[3];
	document.E.Preview.value = a[4] || "";
	document.E.IsPreview.checked = a[5];
	document.E.UserFilter.value = a[6] || "";
	document.E.Sync.checked = a[7];
	document.E.Ansi.checked = a[8];
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
	SetData(sel, [document.E.Name.value, document.E.Path.value, !document.E.Enable.checked, document.E.Filter.checked, document.E.Preview.value, document.E.IsPreview.checked, document.E.UserFilter.value, document.E.Sync.checked, document.E.Ansi.checked], document.E.Enable.checked);
	g_Chg.List = true;
}

PathChanged = function () {
	if (/ZBYPASS/i.test(document.E.Path.value)) {
		document.E.Sync.checked = true;
	}
	SetProp(true);
}

SetProp = async function (bName) {
	const dllPath = await ExtractPath(te, document.E.Path.value);
	g_.DLL = await api.DllGetClassObject(BuildPath(ui_.Installed, ["addons\\spi\\tspi", ui_.bit, ".dll"].join("")), "{211571E6-E2B9-446F-8F9F-4DFBE338CE8C}");
//	g_.DLL = await api.DllGetClassObject(["C:\\cpp\\tspi\\Debug\\tspi", ui_.bit, "d.dll"].join(""), "{211571E6-E2B9-446F-8F9F-4DFBE338CE8C}");
	if (g_.DLL) {
		g_.SPI = await g_.DLL.open(dllPath);
	}
	if (!g_.SPI) {
		g_.SPI = await api.CreateObject("Object")
	}
	if (bName && await g_.SPI.GetPluginInfo) {
		const ar = await api.CreateObject("Array");
		await g_.SPI.GetPluginInfo(ar);
		document.E.Name.value = await ar[1];
	}
	const arProp = ["IsUnicode", "GetPluginInfo", "IsSupported", "GetPictureInfo", "GetPicture", "GetPreview", "GetArchiveInfo", "GetFileInfo", "GetFile", "ConfigurationDlg"];
	const arHtml = [[], [], [], []];
	const s = [];
	let ar = await api.CreateObject("Array");
	if (g_.SPI) {
		for (let i in arProp) {
			arHtml[i % 3].push('<div style="white-space: nowrap"><input type="checkbox" ', await g_.SPI[arProp[i]] ? "checked" : "", ' onclick="return false;">', arProp[i].replace(/^Is/, ""), '</div>');
		}
		for (let i = 4; i--;) {
			document.getElementById("prop" + i).innerHTML = arHtml[i].join("");
		}
		if (await g_.SPI.GetPluginInfo) {
			await g_.SPI.GetPluginInfo(ar);
		} else {
			await ar.unshift(await fso.GetFileName(dllPath));
		}
		if (await g_.SPI.ConfigurationDlg) {
			await s.push('<input type="button" value="', await GetText("Options..."), '" onclick="g_.SPI.ConfigurationDlg(', await GetTopWindow(), ', 1)"><br>');
		}
	}
	if (window.chrome) {
		ar = await api.CreateObject("SafeArray", ar);
	}
	s.push('<table border="1px" style="width: 100%">');
	for (let i = 0; i < ar.length; i += 2) {
		s.push('<tr><td>', ar[i], '</td><td>', ar[i + 1], '</td></tr>');
	}
	s.push('</table>')
	document.getElementById("ext").innerHTML = s.join("");
	const filter = [];
	for (let j = 2; j < ar.length; j += 2) {
		const s = ar[j];
		if (/\./.test(s) && !/\*/.test(s)) {
			const ar2 = s.split(/\./);
			for (let k = 1; k < ar2.length; k++) {
				filter.push('*.' + ar2[k]);
			}
		} else {
			filter.push(s);
		}
	}
	document.E.elements["UserFilter"].setAttribute("placeholder", filter.join(";") || "*");
}

ED = function (s) {
	const ar = s.split("").reverse();
	for (let i in ar) {
		ar[i] = String.fromCharCode(ar[i].charCodeAt(0) ^ 13);
	}
	return ar.join("");
}

const bitName = await GetTextR(ui_.bit + "-bit");
const infoName = await GetAddonInfo(Addon_Id).Name;
document.title = infoName + " " + bitName;
if (ui_.bit == 64) {
	document.getElementById("bit1").innerHTML = "(sph/" + bitName + ")";
	document.getElementById("_browse1").onclick = function () {
		RefX('Path', 0, 0, 1, infoName + ' ' + bitName + ' (*.sph)|*.sph');
	}
} else {
	document.getElementById("bit1").innerHTML = "(spi/" + bitName + ")";
	document.getElementById("_browse1").onclick = function () {
		RefX('Path', 0, 0, 1, infoName + ' ' + bitName + ' (*.spi)|*.spi');
	}
}

LoadFS();
SetOnChangeHandler();

SaveLocation = async function () {
	if (g_bChanged) {
		await ReplaceFS();
	}
	if (g_Chg.List) {
		await SaveFS();
	}
};
