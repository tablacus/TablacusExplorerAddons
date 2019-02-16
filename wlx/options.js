var AddonName = "WLX";

var ado = OpenAdodbFromTextFile("addons\\" + AddonName.toLowerCase() + "\\options.html");
if (ado) {
	SetTabContents(4, "General", ado.ReadText(adReadAll));
	ado.Close();
}

LoadLS = function ()
{
	if (!g_x.List) {
		g_x.List = document.E.List;
		g_x.List.length = 0;
		var nSelectSize = g_x.List.size;
		var xml = OpenXml(AddonName.toLowerCase() + ".xml", false, false);
		if (xml) {
			var items = xml.getElementsByTagName("Item");
			var i = items.length;
			g_x.List.length = i;
			while (--i >= 0) {
				var item = items[i];
				SetData(g_x.List[i], [item.getAttribute("Name"), item.getAttribute("Path"), item.getAttribute("Fit")]);
			}
		}
		EnableSelectTag(g_x.List);
	}
}

EditLS = function ()
{
	if (g_x.List.selectedIndex < 0) {
		return;
	}
	var a = g_x.List[g_x.List.selectedIndex].value.split(g_sep);
	document.E.Name.value = a[0];
	document.E.Path.value = a[1];
	document.E.Fit.checked = a[2];
	SetProp();
}

ReplaceLS = function ()
{
	ClearX();
	if (g_x.List.selectedIndex < 0) {
		g_x.List.selectedIndex = ++g_x.List.length - 1;
		EnableSelectTag(g_x.List);
	}
	var sel = g_x.List[g_x.List.selectedIndex];
	o = document.E.Type;
	SetData(sel, [document.E.Name.value, document.E.Path.value, document.E.Fit.checked]);
	g_Chg.List = true;
}

PathChanged = function ()
{
	var re = /^(.*)64$/.exec(document.E.Path.value);
	if (re) {
		document.E.Path.value = re[1];
	}
	SetProp(true);
}

SetProp = function (bName)
{
	var dllPath = (ExtractMacro(te, api.PathUnquoteSpaces(document.E.Path.value)) + (api.sizeof("HANDLE") > 4 ? "64" : "")).replace(/\.u(wlx64)$/, ".$1");
	var twlxPath = fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), ["addons\\wlx\\twlx", api.sizeof("HANDLE") * 8, ".dll"].join(""));

	var DLL = api.DllGetClassObject(twlxPath, "{E160213A-4E9E-44f3-BD39-8297499608B6}");
	var WLX = (DLL ? DLL.open(dllPath) : {}) || {};
	if (bName) {
		document.E.Name.value = fso.GetBaseName(document.E.Path.value);
	}
	var arProp = ["IsUnicode", "ListLoad", "ListLoadNext", "ListCloseWindow", "ListGetDetectString", "ListSetDefaultParams", "ListGetPreviewBitmap"];
	var arHtml = [[], [], [], []];
	for (var i in arProp) {
		arHtml[i % 2].push('<div style="white-space: nowrap"><input type="checkbox" ', WLX[arProp[i]] ? "checked" : "", ' onclick="return false;">', arProp[i].replace(/^Is/, ""), '</div>');
	}
	arHtml[2].push('64bit<br /><input type="text" value="', (ExtractMacro(te, api.PathUnquoteSpaces(document.E.Path.value)) + "64").replace(/\.u(wlx64)$/, ".$1").replace(/"/g, "&quot;"), '" style="width: 100%" readonly /><br />');
	if (WLX.ListGetDetectString) {
		arHtml[3].push(EncodeSC(WLX.ListGetDetectString()));
	}
	for (var i = arHtml.length; i--;) {
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

LoadLS();
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
		ReplaceLS();
	}
	if (g_Chg.List) {
		var xml = CreateXml();
		var root = xml.createElement("TablacusExplorer");
		var o = document.E.List;
		for (var i = 0; i < o.length; i++) {
			var item = xml.createElement("Item");
			var a = o[i].value.split(g_sep);
			item.setAttribute("Name", a[0]);
			item.setAttribute("Path", a[1]);
			item.setAttribute("Fit", a[2]);
			root.appendChild(item);
		}
		xml.appendChild(root);
		SaveXmlEx(AddonName.toLowerCase() + ".xml", xml);
	}
}
