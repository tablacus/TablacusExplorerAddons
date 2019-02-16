var g_Chg = {List: false};

var ado = OpenAdodbFromTextFile("addons\\" + Addon_Id + "\\options.html");
if (ado) {
	SetTabContents(4, "", ado.ReadText(adReadAll));
	ado.Close();
}

Addons.CAL =
{
	ConfigFile: "cal.xml"
}

LoadFS = function ()
{
	if (!g_x.List) {
		g_x.List = document.E.List;
		g_x.List.length = 0;
		var nSelectSize = g_x.List.size;
		xml = OpenXml(Addons.CAL.ConfigFile, false, false);
		if (xml) {
			var items = xml.getElementsByTagName("Item");
			var i = items.length;
			g_x.List.length = i;
			while (--i >= 0) {
				var item = items[i];
				SetData(g_x.List[i], [item.getAttribute("Name"), item.getAttribute("Path"), item.getAttribute("Filter"), item.getAttribute("Extract"), item.getAttribute("Add"), item.getAttribute("Delete")]);
			}
		}
		EnableSelectTag(g_x.List);
	}
}

SaveFS = function ()
{
	if (g_Chg.List) {
		var xml = CreateXml();
		var root = xml.createElement("TablacusExplorer");
		var o = document.E.List;
		for (var i = 0; i < o.length; i++) {
			var item = xml.createElement("Item");
			var a = o[i].value.split(g_sep);
			item.setAttribute("Name", a[0]);
			item.setAttribute("Path", a[1]);
			item.setAttribute("Filter", a[2]);
			item.setAttribute("Extract", a[3]);
			item.setAttribute("Add", a[4]);
			item.setAttribute("Delete", a[5]);
			root.appendChild(item);
		}
		xml.appendChild(root);
		SaveXmlEx(Addons.CAL.ConfigFile, xml);
	}
}

EditFS = function ()
{
	if (g_x.List.selectedIndex < 0) {
		return;
	}
	var a = g_x.List[g_x.List.selectedIndex].value.split(g_sep);
	document.E.Name.value = a[0];
	document.E.Path.value = a[1];
	document.E.Filter.value = a[2];
	document.E.Extract.value = a[3];
	document.E.Add.value = a[4];
	document.E.Delete.value = a[5];
	SetProp();
}

ReplaceFS = function ()
{
	ClearX();
	if (g_x.List.selectedIndex < 0) {
		g_x.List.selectedIndex = ++g_x.List.length - 1;
		EnableSelectTag(g_x.List);
	}
	var sel = g_x.List[g_x.List.selectedIndex];
	o = document.E.Type;
	SetData(sel, [document.E.Name.value, document.E.Path.value, document.E.Filter.value, document.E.Extract.value, document.E.Add.value, document.E.Delete.value]);
	g_Chg.List = true;
	SetProp();
}

LoadDll = function ()
{
	var dllPath = ExtractMacro(te, api.PathUnquoteSpaces(document.E.Path.value)).replace(/\*/g, api.sizeof("HANDLE") * 8);
	if (/\.exe"?\s*/i.test(dllPath)) {
		return {};
	}
	var bit = String(api.sizeof("HANDLE") * 8);
	var DLL = {
		X: api.DllGetClassObject(fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), "addons\\cal\\tcal" + bit + '.dll'), "{D45DF22D-DA6A-406b-8C1E-5A6642B5BEE3}"),
		Path: dllPath,
		Name: document.E.Name.value.replace(/\W.*$/, ""),
	};
	var CAL = DLL.X.open(DLL.Path, DLL.Name);
	if (!CAL && api.sizeof("HANDLE") == 8 && /UNLHA[36][24].DLL$|UNZIP[36][24].DLL$|ZIP[36][24]J\.DLL$|TAR[36][24]\.DLL$|CAB[36][24]\.DLL$|UNRAR[36][24]\.DLL$|7\-ZIP[36][24]\.DLL$/i.test(DLL.Path)) {
		CAL = DLL.X.open(DLL.Path.replace(/[^\\]*\.dll$/, "UNBYPASS.DLL"), DLL.Name);
		if (CAL) {
			DLL.Unbypass = true;
		}
	}
	DLL.CAL = CAL || {};
	return DLL;
}

SetProp = function ()
{
	var arHtml = [[], []];
	var DLL = LoadDll();
	if (DLL.CAL) {
		var CAL = DLL.CAL;
		var arProp = ["Exec", "GetVersion", "GetRunning", "CheckArchive", "ConfigDialog", "OpenArchive", "CloseArchive", "FindFirst", "FindNext"];
		for (var i in arProp) {
			arHtml[i % 2].push('<div style="white-space: nowrap"><input type="checkbox" ', CAL[arProp[i]] ? "checked" : "", ' onclick="return false;">', DLL.Name, arProp[i].replace(/^Exec$/, ""), '</div>');
		}
		arHtml[0].push('<input type="checkbox" ', CAL.IsUnicode ? "checked" : "", ' onclick="return false;">Unicode<br / >');
		if (DLL.Unbypass) {
			arHtml[1].push('<input type="checkbox" checked onclick="return false;">Unbypass<br / >');
		}
	}
	for (var i = arHtml.length; i--;) {
		document.getElementById("prop" + i).innerHTML = arHtml[i].join("");
	}
	var ar = [fso.GetFileName(DLL.Path)];
	if (DLL.CAL && DLL.CAL.GetVersion) {
		var v = DLL.CAL.GetVersion();
		if (v) {
			ar.push(" Ver. " + v / 100)
		}
	}
	document.getElementById("ver").innerHTML = ar.join("");
}

ConfigDialog = function ()
{
	var DLL = LoadDll();
	if (!DLL.X) {
		return;
	}
	var CAL = DLL.X.open(DLL.Path, DLL.Name);
	if (!CAL && api.sizeof("HANDLE") == 8 && /UNLHA[36][24].DLL$|UNZIP[36][24].DLL$|ZIP[36][24]J\.DLL$|TAR[36][24]\.DLL$|CAB[36][24]\.DLL$|UNRAR[36][24]\.DLL$|7\-ZIP[36][24]\.DLL$/i.test(DLL.Path)) {
		CAL = Addons.CAL.DLL.open(DLL.Path.replace(/[^\\]*\.dll$/, "UNBYPASS.DLL"), DLL.Name);
		if (CAL) {
			DLL.Unbypass = true;
		}
	}
	if (!CAL) {
		return;
	}
	var szOption = [];
	var hwnd = api.GetWindowLongPtr(api.GetWindow(document), GWLP_HWNDPARENT);
	CAL.ConfigDialog(hwnd, szOption, 9999);
}

AddArchiver = function ()
{
	var o = document.getElementById("_Archiver");
	document.E.List.selectedIndex = -1;
	o = o[o.selectedIndex];
	var a = o.value.split("/");
	a.unshift(o.text);
	document.E.Name.value = a[0];
	document.E.Path.value = a[1];
	document.E.Filter.value = a[2];
	document.E.Extract.value = a[3];
	document.E.Add.value = a[4];
	document.E.Delete.value = a[5];
	AddX('List', ReplaceFS);
}

LoadFS();
SetOnChangeHandler();
if (document.documentMode >= 9) {
	setTimeout(function ()
	{
		var h = (document.getElementById("tools").offsetHeight + document.getElementById("buttons").offsetHeight + document.getElementById("tabs").offsetHeight) * 1.2;
		document.getElementById("pane").style.height = "calc(100vh - " + h + "px)";
	}, 99);
}

SaveLocation = function ()
{
	if (g_bChanged) {
		ReplaceFS();
	}
	if (g_Chg.List) {
		SaveFS();
	}
};
