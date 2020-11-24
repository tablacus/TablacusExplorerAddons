var g_MP0 = "";
var g_MP = "";

SetTabContents(3, "General", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));
var s = [];
s.push('<p><input form="E" type="checkbox" id="!ExSort"><label for="!ExSort">@shell32.dll,-50690[Arrange by:]</label> <label for="!ExSort">@shell32.dll,-4131</label> <label for="!ExSort">Top</label> (*)</p>');
s.push('<p><input form="E" type="button" value="Master Password" onclick="SetMP()"></p>');
SetTabContents(4, "Advanced", s);

LoadFS = async function () {
	if (!g_x.List) {
		g_x.List = document.E.List;
		g_x.List.length = 0;
		var xml = await OpenXml(Addon_Id + ".xml", false, false);
		if (xml) {
			var items = await xml.getElementsByTagName("Item");
			var i = await GetLength(items);
			g_x.List.length = i;
			while (--i >= 0) {
				var item = await items[i];
				SetData(g_x.List[i], [await item.getAttribute("Name"), await item.getAttribute("Path")]);
			}
			items = await xml.getElementsByTagName("MP");
			if (await GetLength(items)) {
				g_MP = ED(await api.base64_decode(await items[0].text, true));
				if (await items[0].getAttribute("CRC") != await api.CRC32(g_MP)) {
					g_MP = "";
				}
				g_MP0 = g_MP;
			}
			var b = true;
			items = await xml.getElementsByTagName("Conf");
			if (await GetLength(items)) {
				if (await items[0].getAttribute("NoExSort")) {
					b = false;
				}
			}
			document.getElementById("!ExSort").checked = b;
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
			await item.setAttribute("Name", a[0]);
			await item.setAttribute("Path", a[1]);
			await root.appendChild(item);
		}
		if (g_MP) {
			var item = await xml.createElement("MP");
			item.text = await api.base64_encode(ED(g_MP));
			await item.setAttribute("CRC", await api.CRC32(g_MP));
			await root.appendChild(item);
		}
		if (!document.getElementById("!ExSort").checked) {
			var item = await xml.createElement("Conf");
			await item.setAttribute("NoExSort", true);
			await root.appendChild(item);
		}
		await xml.appendChild(root);
		SaveXmlEx(Addon_Id + ".xml", xml);
		if (g_MP != g_MP0) {
			var dbfile = BuildPath(te.Data.DataFolder, "config\\wfx_" + (wnw.ComputerName.toLowerCase()) + ".bin");
			try {
				var ado = await api.CreateObject("ads");;
				ado.Type = adTypeBinary;
				await ado.Open();
				await ado.LoadFromFile(dbfile);
				var body = await api.CryptUnprotectData(ado.Read(adReadAll), g_MP0, true);
				ado.Close();
			} catch (e) {
				body = "";
			}
			if (body) {
				try {
					var ado = await api.CreateObject("ads");
					ado.Type = adTypeBinary;
					await ado.Open();
					await ado.Write(await api.CryptProtectData(body, g_MP));
					await ado.SaveToFile(dbfile, adSaveCreateOverWrite);
					ado.Close();
				} catch (e) { }
			}
		}
	}
}

EditFS = function () {
	if (g_x.List.selectedIndex < 0) {
		return;
	}
	var a = g_x.List[g_x.List.selectedIndex].value.split(g_sep);
	document.E.Name.value = a[0];
	document.E.Path.value = a[1];
	SetProp();
}

ReplaceFS = function () {
	ClearX();
	if (g_x.List.selectedIndex < 0) {
		g_x.List.selectedIndex = ++g_x.List.length - 1;
		EnableSelectTag(g_x.List);
	}
	var sel = g_x.List[g_x.List.selectedIndex];
	o = document.E.Type;
	SetData(sel, [document.E.Name.value, document.E.Path.value]);
	g_Chg.List = true;
}

PathChanged = function () {
	var re = /^(.*)64$/.exec(document.E.Path.value);
	if (re) {
		document.E.Path.value = re[1];
	}
	SetProp(true);
}

SetProp = async function (bName) {
	var WFX = {};
	var nHandle = await api.sizeof("HANDLE");
	var dllPath = (await ExtractMacro(te, await api.PathUnquoteSpaces(document.E.Path.value)) + (await nHandle > 4 ? "64" : "")).replace(/\.u(wfx64)$/, ".$1");
	var twfxPath = BuildPath(ui_.Installed, ["addons\\wfx\\twfx", nHandle * 8, ".dll"].join(""));
	var DLL = await api.DllGetClassObject(twfxPath, "{5396F915-5592-451c-8811-87314FC0EF11}");
	if (DLL) {
		WFX = await DLL.open(dllPath) || {};
	}
	if (bName) {
		document.E.Name.value = await WFX.FsGetDefRootName ? await WFX.FsGetDefRootName() : await fso.GetBaseName(document.E.Path.value);
	}
	var arProp = ["IsUnicode", "FsInit", "FsFindFirst", "FsFindNext", "FsFindClose", "FsSetCryptCallback", "FsGetDefRootName", "FsGetFile", "FsPutFile", "FsRenMovFile", "FsDeleteFile", "FsRemoveDir", "FsMkDir", "FsExecuteFile", "FsSetAttr", "FsSetTime", "FsDisconnect", "FsExtractCustomIcon", "FsSetDefaultParams"];
	var arHtml = [[], [], []];
	for (var i in arProp) {
		arHtml[i % 2].push('<div style="white-space: nowrap"><input type="checkbox" ', await WFX[arProp[i]] ? "checked" : "", ' onclick="return false;">', arProp[i].replace(/^Is/, ""), '</div>');
	}
	arHtml[2].push(await GetTextR('64-bit'), '<br><input type="text" value="', (await ExtractMacro(te, await api.PathUnquoteSpaces(document.E.Path.value)) + "64").replace(/\.u(wfx64)$/, ".$1").replace(/"/g, "&quot;"), '" style="width: 100%" readonly><br>');
	for (var i = arHtml.length; i--;) {
		document.getElementById("prop" + i).innerHTML = arHtml[i].join("");
	}
	var ar = [await fso.GetFileName(dllPath)];
	try {
		var s = await fso.GetFileVersion(dllPath);
		if (s) {
			ar.push("Ver. " + s);
		}
	} catch (e) { }
	document.getElementById("ver").innerHTML = ar.join(" ");
}

SetMP = async function () {
	var s = await MainWindow.InputDialog("Master Password", "");
	if ("string" === typeof s && s != g_MP && await confirmOk()) {
		g_MP = s;
		g_Chg.List = true;
	}
}

ED = function (s) {
	var ar = s.split("").reverse();
	for (var i in ar) {
		ar[i] = String.fromCharCode(ar[i].charCodeAt(0) ^ 13);
	}
	return ar.join("");
}

SaveLocation = function () {
	if (g_bChanged) {
		ReplaceFS();
	}
	if (g_Chg.List) {
		SaveFS();
	}
};

setTimeout(function() {
	LoadFS();
	document.getElementById("_browse1").onclick = async function () {
		var s = '*.wfx;*.uwfx;*.wfx64';
		var info = await GetAddonInfo(Addon_Id);
		RefX('Path', 0, 0, 1, await info.Name + '(' + s + ')|' + s);
	}
	SetOnChangeHandler();
	if (ui_.IEVer >= 9) {
		document.getElementById("pane").style.height = "calc(100vh - 8em)";
	}
}, 99);

