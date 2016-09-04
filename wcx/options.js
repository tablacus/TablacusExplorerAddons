var AddonName = "WCX";
var g_Chg = {List: false};

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
}

function ConfigDialog()
{
	var dllPath = ExtractMacro(te, document.F.Path.value) + (api.sizeof("HANDLE") > 4 ? "64" : "");
	var twcxPath = fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), ["addons\\wcx\\twcx", api.sizeof("HANDLE") * 8, ".dll"].join(""));
	var DLL = api.DllGetClassObject(twcxPath, "{56297D71-E778-4dfd-8678-6F4079A2BC50}");
	if (!DLL) {
		MessageBox(api.LoadString(hShell32, 8720).replace(/%1[!ls]*/, twcxPath) , TITLE, MB_OK);
		return;
	}
	var WCX = DLL.open(dllPath);
	if (!WCX) {
		MessageBox(api.LoadString(hShell32, 8720).replace(/%1[!ls]*/, dllPath) , TITLE, MB_OK);
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
	SetOptions(SaveFS);
});
