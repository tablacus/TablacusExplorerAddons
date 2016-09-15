var AddonName = "WFX";
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
	SetProp(true);
}

function SetProp(bName)
{
	var WFX;
	var dllPath = (ExtractMacro(te, document.F.Path.value) + (api.sizeof("HANDLE") > 4 ? "64" : "")).replace(/\.u(wfx64)$/, ".$1");
	var twfxPath = fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), ["addons\\wfx\\twfx", api.sizeof("HANDLE") * 8, ".dll"].join(""));
	var DLL = api.DllGetClassObject(twfxPath, "{5396F915-5592-451c-8811-87314FC0EF11}");
	if (DLL) {
		WFX = DLL.open(dllPath) || {};
	}
	if (bName) {
		document.F.Name.value = WFX.FsGetDefRootName ? WFX.FsGetDefRootName() : fso.GetBaseName(document.F.Path.value);
	}
	var arProp = ["IsUnicode", "FsInit", "FsFindFirst", "FsFindNext", "FsFindClose", "FsSetCryptCallback", "FsGetDefRootName", "FsGetFile", "FsPutFile", "FsRenMovFile", "FsDeleteFile", "FsRemoveDir", "FsMkDir", "FsExecuteFile", "FsSetAttr", "FsSetTime", "FsDisconnect", "FsExtractCustomIcon", "FsSetDefaultParams"];
	var arHtml = [[], [], [], []];
	for (var i in arProp) {
		arHtml[i % 3].push('<input type="checkbox" ', WFX[arProp[i]] ? "checked" : "", ' onclick="return false;">', arProp[i].replace(/^Is/, ""), '<br / >');
	}
	arHtml[3].push('64bit<br /><input type="text" value="', (ExtractMacro(te, document.F.Path.value) + "64").replace(/\.u(wfx64)$/, ".$1").replace(/"/g, "&quot;"), '" style="width: 100%" readonly /><br />');
	for (var i = 4; i--;) {
		document.getElementById("prop" + i).innerHTML = arHtml[i].join("");
	}
	var ar = [fso.GetFileName(dllPath)];
	try {
		var s = fso.GetFileVersion(dllPath);
		if (s) {
			ar.push("Ver. " + s);
		}
	} catch(e) {}
	document.getElementById("ver").innerHTML = ar.join(" ");
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
