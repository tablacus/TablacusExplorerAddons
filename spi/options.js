var AddonName = "SPI";
var g_Chg = {List: false, Data: "List"};
var SPI;
var tspiPath = fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), ["addons\\spi\\tspi", api.sizeof("HANDLE") * 8, ".dll"].join(""));
var DLL = api.DllGetClassObject(tspiPath, "{211571E6-E2B9-446F-8F9F-4DFBE338CE8C}");

function LoadFS()
{
	if (!g_x.List) {
		g_x.List = document.F.List;
		g_x.List.length = 0;
		var nSelectSize = g_x.List.size;
		var xml = OpenXml(AddonName.toLowerCase() + (api.sizeof("HANDLE") * 8) + ".xml", false, false);
		if (xml) {
			var items = xml.getElementsByTagName("Item");
			var i = items.length;
			g_x.List.length = i;
			while (--i >= 0) {
				var item = items[i];
				SetData(g_x.List[i], [item.getAttribute("Name"), item.getAttribute("Path"), item.getAttribute("Disabled"), item.getAttribute("Filter")], !item.getAttribute("Disabled"));
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
			item.setAttribute("Disabled", a[2]);
			item.setAttribute("Filter", a[3]);
			root.appendChild(item);
		}
		xml.appendChild(root);
		SaveXmlEx(AddonName.toLowerCase() + (api.sizeof("HANDLE") * 8) + ".xml", xml);
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
	document.F.Enable.checked = !a[2];
	document.F.Filter.checked = a[3];
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
	SetData(sel, [document.F.Name.value, document.F.Path.value, !document.F.Enable.checked, document.F.Filter.checked], document.F.Enable.checked);
	g_Chg.List = true;
}

function PathChanged()
{
	SetProp(true);
}

function SetProp(bName)
{
	SPI = null;
	var dllPath = api.PathUnquoteSpaces(ExtractMacro(te, document.F.Path.value));
	if (DLL) {
		SPI = DLL.open(dllPath) || {};
	}
	if (bName && SPI.GetPluginInfo) {
		var ar = [];
		SPI.GetPluginInfo(ar);
		document.F.Name.value = ar[1];
	}
	var arProp = ["IsUnicode", "GetPluginInfo", "IsSupported", "GetPictureInfo", "GetPicture", "GetPreview", "GetArchiveInfo", "GetFileInfo", "GetFile", "ConfigurationDlg"];
	var arHtml = [[], [], [], []];
	for (var i in arProp) {
		arHtml[i % 3].push('<input type="checkbox" ', SPI[arProp[i]] ? "checked" : "", ' onclick="return false;">', arProp[i].replace(/^Is/, ""), '<br / >');
	}
	for (var i = 4; i--;) {
		document.getElementById("prop" + i).innerHTML = arHtml[i].join("");
	}
	var ar = [];
	if (SPI.GetPluginInfo) {
		SPI.GetPluginInfo(ar);
	} else {
		ar.unshift(fso.GetFileName(dllPath));
	}
	var s = [];
	if (SPI.ConfigurationDlg) {
		s.push('<input type="button" value="', GetText("Options..."), '" onclick="SPI.ConfigurationDlg(', te.hwnd, ', 1)" /><br />');
	}
	s.push('<table border="1px" style="width: 100%">');
	for (var i = 0; i < ar.length; i += 2) {
		s.push('<tr><td>', ar[i], '</td><td>', ar[i + 1], '</td></tr>');
	}
	s.push('</table>')
	document.getElementById("ext").innerHTML = s.join("");
	document.F.elements["_Filter"].value = ar[2] || "*";		
}

function ED(s)
{
	var ar = s.split("").reverse();
	for (var i in ar) {
		ar[i] = String.fromCharCode(ar[i].charCodeAt(0) ^ 13);
	}
	return ar.join("");
}

ApplyLang(document);
var info = GetAddonInfo(AddonName.toLowerCase());
var bit = api.sizeof("HANDLE") * 8;
document.title = info.Name + " " + bit + "bit";
if (bit == 64) {
	document.getElementById("bit1").innerHTML = "(sph/64bit)";
	document.getElementById("browse1").onclick = function ()
	{
		RefX('Path', 0, 0, 1, 'Susie Plug-in 64bit (sph)|*.sph');
	}
} else {
	document.getElementById("bit1").innerHTML = "(spi/32bit)";
	document.getElementById("browse1").onclick = function ()
	{
		RefX('Path', 0, 0, 1, 'Susie Plug-in 32bit (spi)|*.spi');
	}
}

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
