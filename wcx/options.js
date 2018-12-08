var AddonName = "WCX";
var g_Chg = {List: false, Data: "List"};

function LoadFS()
{
	if (!g_x.List) {
		g_x.List = document.F.List;
		g_x.List.length = 0;
		var nSelectSize = g_x.List.size;
		var xml = OpenXml(AddonName.toLowerCase() + ".xml", false, false);
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

function SaveFS()
{
	if (g_Chg.List) {
		var xml = CreateXml();
		var root = xml.createElement("TablacusExplorer");
		var o = document.F.List;
		for (var i = 0; i < o.length; i++) {
			var item = xml.createElement("Item");
			var a = o[i].value.split(g_sep);
			item.setAttribute("Name", a[0]);
			item.setAttribute("Path", a[1]);
			item.setAttribute("Filter", a[2]);
			root.appendChild(item);
		}
		xml.appendChild(root);
		SaveXmlEx(AddonName.toLowerCase() + ".xml", xml);
	}
}

function EditFS()
{
	if (g_x.List.selectedIndex < 0) {
		return;
	}
	var a = g_x.List[g_x.List.selectedIndex].value.split(g_sep);
	document.F.Name.value = a[0];
	document.F.Path.value = a[1];
	document.F.Filter.value = a[2];
	SetProp();
}

function ReplaceFS()
{
	ClearX();
	if (g_x.List.selectedIndex < 0) {
		g_x.List.selectedIndex = ++g_x.List.length - 1;
		EnableSelectTag(g_x.List);
	}
	var sel = g_x.List[g_x.List.selectedIndex];
	o = document.F.Type;
	SetData(sel, [document.F.Name.value, document.F.Path.value, document.F.Filter.value]);
	g_Chg.List = true;
}

function PathChanged()
{
	var re = /^(.*)64$/.exec(document.F.Path.value);
	if (re) {
		document.F.Path.value = re[1];
	}
	if (document.F.Name.value === "") {
		document.F.Name.value = fso.GetBaseName(document.F.Path.value);
	}
	SetProp();
}

function LoadDll()
{
	var twcxPath = fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), ["addons\\wcx\\twcx", api.sizeof("HANDLE") * 8, ".dll"].join(""));
	return {
		X: api.DllGetClassObject(twcxPath, "{56297D71-E778-4dfd-8678-6F4079A2BC50}"),
		Path: (ExtractMacro(te, api.PathUnquoteSpaces(document.F.Path.value)) + (api.sizeof("HANDLE") > 4 ? "64" : "")).replace(/\.u(wcx64)$/, ".$1")
	};
}

function SetProp()
{
	var DLL = LoadDll();
	if (DLL.X) {
		var WCX = DLL.X.open(DLL.Path) || {};
	}
	var arProp = ["IsUnicode", "OpenArchive", "ReadHeaderEx", "ProcessFile", "CloseArchive", "PackFiles", "DeleteFiles", "CanYouHandleThisFile", "ConfigurePacker", "SetChangeVolProc", "SetProcessDataProc", "PackSetDefaultParams"];
	var arHtml = [[], [], [], []];
	for (var i in arProp) {
		arHtml[i % 2].push('<div style="white-space: nowrap"><input type="checkbox" ', WCX[arProp[i]] ? "checked" : "", ' onclick="return false;">', arProp[i].replace(/^Is/, ""), '</div>');
	}
	arHtml[2].push('64bit<br /><input type="text" value="', EncodeSC(ExtractMacro(te, api.PathUnquoteSpaces(document.F.Path.value)) + "64").replace(/\.u(wcx64)$/, ".$1"), '" style="width: 100%" readonly /><br />');
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

function ConfigDialog()
{
	var DLL = LoadDll();
	if (!DLL.X) {
		MessageBox(api.LoadString(hShell32, 8720).replace(/%1[!ls]*/, twcxPath) , TITLE, MB_OK);
		return;
	}
	var WCX = DLL.X.open(DLL.Path);
	if (!WCX) {
		MessageBox(api.LoadString(hShell32, 8720).replace(/%1[!ls]*/, DLL.Path) , TITLE, MB_OK);
		return;
	}
	WCX.ConfigurePacker(api.GetWindowLongPtr(api.GetWindow(document), GWLP_HWNDPARENT));
}

ApplyLang(document);
var info = GetAddonInfo(AddonName.toLowerCase());
document.title = info.Name;
LoadFS();
SetOnChangeHandler();

AddEventEx(window, "beforeunload", function ()
{
	if (g_nResult == 2 || !g_bChanged) {
		return;
	}
	if (ConfirmX(true, ReplaceFS)) {
		SaveFS();
		TEOk();
		return;
	}
	event.returnValue = GetText('Close');
});
