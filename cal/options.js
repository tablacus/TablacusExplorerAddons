g_Chg = { List: false };

SetTabContents(4, "", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));

Addons.CAL = {
	ConfigFile: "cal.xml"
}

LoadFS = async function () {
	if (!g_x.List) {
		g_x.List = document.E.List;
		g_x.List.length = 0;
		xml = await OpenXml(Addons.CAL.ConfigFile, false, false);
		if (xml) {
			const items = await xml.getElementsByTagName("Item");
			let i = await GetLength(items);
			g_x.List.length = i;
			while (--i >= 0) {
				const item = await items[i];
				SetData(g_x.List[i], await Promise.all([item.getAttribute("Name"), item.getAttribute("Path"), item.getAttribute("Filter"), item.getAttribute("Extract"), item.getAttribute("Add"), item.getAttribute("Delete"), item.getAttribute("Content"), item.getAttribute("IsContent"), item.getAttribute("ContentFilter")]));
			}
		}
		EnableSelectTag(g_x.List);
	}
}

SaveFS = async function () {
	if (g_Chg.List) {
		const xml = CreateXml();
		const root = xml.createElement("TablacusExplorer");
		const o = document.E.List;
		for (let i = 0; i < o.length; i++) {
			const item = xml.createElement("Item");
			const a = o[i].value.split(g_sep);
			const r = [];
			r.push(item.setAttribute("Name", a[0]));
			r.push(item.setAttribute("Path", a[1]));
			r.push(item.setAttribute("Filter", a[2]));
			r.push(item.setAttribute("Extract", a[3]));
			r.push(item.setAttribute("Add", a[4]));
			r.push(item.setAttribute("Delete", a[5]));
			r.push(item.setAttribute("Content", a[6]));
			r.push(item.setAttribute("IsContent", a[7]));
			r.push(item.setAttribute("ContentFilter", a[8]));
			await Promise.all(r);
			await root.appendChild(item);
		}
		await xml.appendChild(root);
		await SaveXmlEx(Addons.CAL.ConfigFile, xml);
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
	document.E.Extract.value = a[3];
	document.E.Add.value = a[4];
	document.E.Delete.value = a[5];
	document.E.Content.value = a[6] || "";
	document.E.IsContent.checked = a[7] != 0;
	document.E.ContentFilter.value = a[8] || "";
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
	SetData(sel, [document.E.Name.value, document.E.Path.value, document.E.Filter.value, document.E.Extract.value, document.E.Add.value, document.E.Delete.value, document.E.Content.value, document.E.IsContent.checked ? 1 : 0, document.E.ContentFilter.value]);
	g_Chg.List = true;
	SetProp();
}

LoadDll = async function () {
	const dllPath = (await ExtractPath(te, document.E.Path.value)).replace(/\*/g, ui_.bit);
	if (/\.exe"?\s*/i.test(dllPath)) {
		return {};
	}
	const DLL = {
		X: await api.DllGetClassObject(BuildPath(ui_.Installed, "addons\\cal\\tcal" + ui_.bit + '.dll'), "{D45DF22D-DA6A-406b-8C1E-5A6642B5BEE3}"),
		Path: dllPath,
		Name: document.E.Name.value.replace(/\W.*$/, ""),
	};
	if (!DLL.Name) {
		return {};
	}
	let CAL = await DLL.X.Open(DLL.Path, DLL.Name);
	if (!CAL && ui_.bit == 64 && /UNLHA[36][24].DLL$|UNZIP[36][24].DLL$|ZIP[36][24]J\.DLL$|TAR[36][24]\.DLL$|CAB[36][24]\.DLL$|UNRAR[36][24]\.DLL$|7\-ZIP[36][24]\.DLL$/i.test(DLL.Path)) {
		CAL = await DLL.X.Open(DLL.Path.replace(/[^\\]*\.dll$/i, "UNBYPASS.DLL"), DLL.Name);
		if (CAL) {
			DLL.Unbypass = true;
		}
	}
	DLL.CAL = CAL || {};
	return DLL;
}

SetProp = async function () {
	const arHtml = [[], []];
	const DLL = await LoadDll();
	const CAL = DLL.CAL;
	document.getElementById("btnConfig").style.visibility= "hidden";
	if (CAL) {
		const arProp = ["Exec", "GetVersion", "GetRunning", "CheckArchive", "ConfigDialog", "OpenArchive", "CloseArchive", "FindFirst", "FindNext", "ExtractMem"];
		for (let i in arProp) {
			const b = await CAL[arProp[i]];
			arHtml[i % 2].push('<div style="white-space: nowrap"><input type="checkbox" ', b ? "checked" : "", ' onclick="return false;">', DLL.Name, arProp[i].replace(/^Exec$/, ""), '</div>');
			if (b && arProp[i] == "ConfigDialog") {
				document.getElementById("btnConfig").style.visibility = "visible";
			}
		}
		arHtml[0].push('<input type="checkbox" ', await CAL.IsUnicode ? "checked" : "", ' onclick="return false;">Unicode<br>');
		if (DLL.Unbypass) {
			arHtml[1].push('<input type="checkbox" checked onclick="return false;">Unbypass<br>');
		}
	}
	for (let i = arHtml.length; i--;) {
		document.getElementById("prop" + i).innerHTML = arHtml[i].join("");
	}
	const ar = [GetFileName(DLL.Path)];
	if (CAL && await CAL.GetVersion) {
		const v = await CAL.GetVersion();
		if (v) {
			ar.push(" Ver. " + v / 100)
		}
	}
	document.getElementById("ver").innerHTML = ar.join("");
}

ConfigDialog = async function () {
	const DLL = await LoadDll();
	if (!DLL.X) {
		return;
	}
	let CAL = await DLL.X.Open(DLL.Path, DLL.Name);
	if (!CAL && ui_.bit == 64 && /UNLHA[36][24].DLL$|UNZIP[36][24].DLL$|ZIP[36][24]J\.DLL$|TAR[36][24]\.DLL$|CAB[36][24]\.DLL$|UNRAR[36][24]\.DLL$|7\-ZIP[36][24]\.DLL$/i.test(DLL.Path)) {
		CAL = await DLL.X.Open(DLL.Path.replace(/[^\\]*\.dll$/i, "UNBYPASS.DLL"), DLL.Name);
		if (CAL) {
			DLL.Unbypass = true;
		}
	}
	if (!CAL) {
		return;
	}
	CAL.ConfigDialog(await GetTopWindow(), await api.CreateObject("Array"), 9999);
}

AddArchiver = async function () {
	let o = document.getElementById("_Archiver");
	document.E.List.selectedIndex = -1;
	o = o[o.selectedIndex];
	const a = o.value.split("/");
	a.unshift(o.text);
	let path = PathUnquoteSpaces(a[1]);
	if (/Program Files/.test(path)) {
		if (!await fso.FileExists(path)) {
			path = PathUnquoteSpaces(path.replace(/(Program Files)/, "$1 (x86)"));
			if (await fso.FileExists(path)) {
				a[1] = exe;
			}
		}
	}
	document.E.Name.value = a[0];
	document.E.Path.value = a[1];
	document.E.Filter.value = a[2];
	document.E.Extract.value = a[3];
	document.E.Add.value = a[4];
	document.E.Delete.value = a[5];
	document.E.Content.value = a[6] || "";
	document.E.IsContent.checked = false;
	document.E.ContentFilter.value = "";
	AddX('List', ReplaceFS);
}

await LoadFS();
if (ui_.IEVer >= 9) {
	setTimeout(function () {
		const h = (document.getElementById("tools").offsetHeight + document.getElementById("buttons").offsetHeight + document.getElementById("tabs").offsetHeight) * 1.5;
		document.getElementById("pane").style.height = "calc(100vh - " + h + "px)";
	}, 999);
}

SaveLocation = async function () {
	if (g_bChanged) {
		ReplaceFS();
	}
	if (g_Chg.List) {
		await SaveFS();
	}
};
