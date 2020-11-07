var Addon_Id = "spi";
var g_Chg = { List: false, Data: "List" };
var SPI;

SetTabContents(4, "", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));

LoadFS = async function () {
	if (!g_x.List) {
		g_x.List = document.E.List;
		g_x.List.length = 0;
		var xml = await OpenXml(Addon_Id + (await api.sizeof("HANDLE") * 8) + ".xml", false, false);
		if (xml) {
			var items = await xml.getElementsByTagName("Item");
			var i = await GetLength(items);
			g_x.List.length = i;
			while (--i >= 0) {
				var item = await items[i];
				SetData(g_x.List[i], [await item.getAttribute("Name"), await item.getAttribute("Path"), await item.getAttribute("Disabled"), await item.getAttribute("Filter"), await item.getAttribute("Preview"), await item.getAttribute("IsPreview"), await item.getAttribute("UserFilter"), await item.getAttribute("Sync"), await item.getAttribute("Ansi")], !await item.getAttribute("Disabled"));
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
		await SaveXmlEx(Addon_Id + (await api.sizeof("HANDLE") * 8) + ".xml", xml);
	}
}

EditFS = function () {
	if (g_x.List.selectedIndex < 0) {
		return;
	}
	var a = g_x.List[g_x.List.selectedIndex].value.split(g_sep);
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
	var sel = g_x.List[g_x.List.selectedIndex];
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
	SPI = null;
	var dllPath = await api.PathUnquoteSpaces(await ExtractMacro(await te, document.E.Path.value));
	var DLL = await api.DllGetClassObject(fso.BuildPath(GetParentFolderName(api.GetModuleFileName(null)), ["addons\\spi\\tspi", api.sizeof("HANDLE") * 8, ".dll"].join("")), "{211571E6-E2B9-446F-8F9F-4DFBE338CE8C}");
	if (DLL) {
		SPI = await DLL.open(dllPath) || {};
	}
	if (bName && await SPI.GetPluginInfo) {
		var ar = await api.CreateObject("Array");
		await SPI.GetPluginInfo(ar);
		document.E.Name.value = await ar[1];
	}
	var arProp = ["IsUnicode", "GetPluginInfo", "IsSupported", "GetPictureInfo", "GetPicture", "GetPreview", "GetArchiveInfo", "GetFileInfo", "GetFile", "ConfigurationDlg"];
	var arHtml = [[], [], [], []];
	var s = [];
	var ar = await api.CreateObject("Array");
	if (SPI) {
		for (var i in arProp) {
			arHtml[i % 3].push('<div style="white-space: nowrap"><input type="checkbox" ', await SPI[arProp[i]] ? "checked" : "", ' onclick="return false;">', arProp[i].replace(/^Is/, ""), '</div>');
		}
		for (var i = 4; i--;) {
			document.getElementById("prop" + i).innerHTML = arHtml[i].join("");
		}
		if (await SPI.GetPluginInfo) {
			await SPI.GetPluginInfo(ar);
		} else {
			await ar.unshift(await fso.GetFileName(dllPath));
		}
		if (await SPI.ConfigurationDlg) {
			await s.push('<input type="button" value="', await GetText("Options..."), '" onclick="SPI.ConfigurationDlg(', await te.hwnd, ', 1)"><br>');
		}
	}
	if (window.chrome) {
		ar = await api.CreateObject("SafeArray", ar);
	}
	s.push('<table border="1px" style="width: 100%">');
	for (var i = 0; i < ar.length; i += 2) {
		s.push('<tr><td>', ar[i], '</td><td>', ar[i + 1], '</td></tr>');
	}
	s.push('</table>')
	document.getElementById("ext").innerHTML = s.join("");
	var filter = [];
	for (var j = 2; j < ar.length; j += 2) {
		var s = ar[j];
		if (/\./.test(s) && !/\*/.test(s)) {
			var ar2 = s.split(/\./);
			for (k = 1; k < ar2.length; k++) {
				filter.push('*.' + ar2[k]);
			}
		} else {
			filter.push(s);
		}
	}
	document.E.elements["UserFilter"].setAttribute("placeholder", filter.join(";") || "*");
}

ED = function (s) {
	var ar = s.split("").reverse();
	for (var i in ar) {
		ar[i] = String.fromCharCode(ar[i].charCodeAt(0) ^ 13);
	}
	return ar.join("");
}

var info = await GetAddonInfo(Addon_Id);
var bit = await api.sizeof("HANDLE") * 8;
var bitName = await GetTextR(bit + "-bit");
var infoName = await info.Name;
document.title = infoName + " " + bitName;
if (bit == 64) {
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
