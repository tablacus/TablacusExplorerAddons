var ado = OpenAdodbFromTextFile("addons\\" + Addon_Id + "\\options.html");
if (ado) {
	SetTabContents(4, "", ado.ReadText(adReadAll));
	ado.Close();
}

Addons.WCX =
{
	ConfigFile: "wcx.xml"
}

LoadFS = function ()
{
	if (!g_x.List) {
		g_x.List = document.E.List;
		g_x.List.length = 0;
		var nSelectSize = g_x.List.size;
		var xml = OpenXml(Addons.WCX.ConfigFile, false, false);
		if (xml) {
			var items = xml.getElementsByTagName("Item");
			var i = items.length;
			g_x.List.length = i;
			while (--i >= 0) {
				var item = items[i];
				SetData(g_x.List[i], [item.getAttribute("Name"), item.getAttribute("Path"), item.getAttribute("Filter")]);
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
			root.appendChild(item);
		}
		xml.appendChild(root);
		SaveXmlEx(Addons.WCX.ConfigFile, xml);
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
	SetData(sel, [document.E.Name.value, document.E.Path.value, document.E.Filter.value]);
	g_Chg.List = true;
}

PathChanged = function ()
{
	var re = /^(.*)64$/.exec(document.E.Path.value);
	if (re) {
		document.E.Path.value = re[1];
	}
	document.E.Name.value = fso.GetBaseName(document.E.Path.value);
	SetProp();
}

LoadDll = function ()
{
	var twcxPath = fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), ["addons\\wcx\\twcx", api.sizeof("HANDLE") * 8, ".dll"].join(""));
	return {
		X: api.DllGetClassObject(twcxPath, "{56297D71-E778-4dfd-8678-6F4079A2BC50}"),
		Path: (ExtractMacro(te, api.PathUnquoteSpaces(document.E.Path.value)) + (api.sizeof("HANDLE") > 4 ? "64" : "")).replace(/\.u(wcx64)$/, ".$1"),
		WCXPATH: twcxPath
	};
}

SetProp = function ()
{
	var DLL = LoadDll();
	if (DLL.X) {
		var WCX = DLL.X.open(DLL.Path) || {};
	}
	if (!WCX) {
		return;
	}
	var arProp = ["IsUnicode", "OpenArchive", "ReadHeaderEx", "ProcessFile", "CloseArchive", "PackFiles", "DeleteFiles", "CanYouHandleThisFile", "ConfigurePacker", "SetChangeVolProc", "SetProcessDataProc", "PackSetDefaultParams"];
	var arHtml = [[], [], [], []];
	for (var i in arProp) {
		arHtml[i % 2].push('<div style="white-space: nowrap"><input type="checkbox" ', WCX[arProp[i]] ? "checked" : "", ' onclick="return false;">', arProp[i].replace(/^Is/, ""), '</div>');
	}
	arHtml[2].push('64bit<br /><input type="text" value="', EncodeSC(ExtractMacro(te, api.PathUnquoteSpaces(document.E.Path.value)) + "64").replace(/\.u(wcx64)$/, ".$1"), '" style="width: 100%" readonly /><br />');
	for (var i = 3; i--;) {
		document.getElementById("prop" + i).innerHTML = arHtml[i].join("");
	}
	var ar = [fso.GetFileName(DLL.Path)];
	try {
		var s = fso.GetFileVersion(DLL.Path);
		if (s) {
			ar.push("Ver. " + s);
		}
	} catch(e) {}
	document.getElementById("ver").innerHTML = ar.join(" ");
}

ConfigDialog = function ()
{
	var DLL = LoadDll();
	if (!DLL.X) {
		MessageBox(api.LoadString(hShell32, 8720).replace(/%1[!ls]*/, DLL.WCXPATH) , TITLE, MB_OK);
		return;
	}
	var WCX = DLL.X.open(DLL.Path);
	if (!WCX) {
		if (DLL.Path) {
			MessageBox(api.LoadString(hShell32, 8720).replace(/%1[!ls]*/, DLL.Path) , TITLE, MB_OK);
		}
		return;
	}
	WCX.ConfigurePacker(api.GetWindowLongPtr(api.GetWindow(document), GWLP_HWNDPARENT));
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
