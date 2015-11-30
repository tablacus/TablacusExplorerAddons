var AddonName = "CAL";
var g_Chg = {List: false};

function LoadFS()
{
	if (!g_x.List) {
		g_x.List = document.F.List;
		g_x.List.length = 0;
		var nSelectSize = g_x.List.size;
		xml = OpenXml(AddonName + ".xml", false, false);
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
			item.setAttribute("Extract", a[3]);
			item.setAttribute("Add", a[4]);
			item.setAttribute("Delete", a[5]);
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
	document.F.Extract.value = a[3];
	document.F.Add.value = a[4];
	document.F.Delete.value = a[5];
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
	SetData(sel, [document.F.Name.value, document.F.Path.value, document.F.Filter.value, document.F.Extract.value, document.F.Add.value, document.F.Delete.value]);
	g_Chg.List = true;
}

function ConfigDialog()
{
	var dllPath = document.F.Path.value.replace(/\*/g, api.sizeof("HANDLE") * 8);
	var procName = document.F.Name.value.replace(/\W.*$/, "");
	if (/\.exe"?\s*/i.test(dllPath)) {
		return;
	}
	var bit = String(api.sizeof("HANDLE") * 8);
	var DLL = api.DllGetClassObject(fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), "addons\\cal\\tcal" + bit + '.dll'), "{D45DF22D-DA6A-406b-8C1E-5A6642B5BEE3}");
	if (!DLL) {
		return;
	}
	var CAL = DLL.open(dllPath, procName);
	if (!CAL) {
		return;
	}
	var szOption = [];
	var hwnd = api.GetWindowLongPtr(api.GetWindow(document), GWLP_HWNDPARENT);
	CAL.ConfigDialog(hwnd, szOption, 9999);
}

function AddArchiver()
{
	var o = document.getElementById("_Archiver");
	document.F.List.selectedIndex = -1;
	o = o[o.selectedIndex];
	var a = o.value.split("/");
	a.unshift(o.text);
	document.F.Name.value = a[0];
	document.F.Path.value = a[1];
	document.F.Filter.value = a[2];
	document.F.Extract.value = a[3];
	document.F.Add.value = a[4];
	document.F.Delete.value = a[5];
	AddX('List', ReplaceFS);
}

ApplyLang(document);
var info = GetAddonInfo("cal");
document.title = info.Name;
LoadFS();
SetOnChangeHandler();
AddEventEx(window, "beforeunload", function ()
{
	SetOptions(SaveFS);
});
