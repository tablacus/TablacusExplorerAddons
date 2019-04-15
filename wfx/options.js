var g_MP0 = "";
var g_MP = "";

var ado = OpenAdodbFromTextFile("addons\\" + Addon_Id + "\\options.html");
if (ado) {
	SetTabContents(3, "General", ado.ReadText(adReadAll));
	ado.Close();
}
var s = [];
s.push('<p><input form="E" type="checkbox" id="!ExSort"><label for="!ExSort">@shell32.dll,-50690[Arrange by:]</label> <label for="!ExSort">@shell32.dll,-4131</label> <label for="!ExSort">Top</label> (*)</p>');
s.push('<p><input form="E" type="button" value="Master Password" onclick="SetMP()"></p>');
SetTabContents(4, "Advanced", s);

LoadFS = function ()
{
	if (!g_x.List) {
		g_x.List = document.E.List;
		g_x.List.length = 0;
		var nSelectSize = g_x.List.size;
		var xml = OpenXml(Addon_Id + ".xml", false, false);
		if (xml) {
			var items = xml.getElementsByTagName("Item");
			var i = items.length;
			g_x.List.length = i;
			while (--i >= 0) {
				var item = items[i];
				SetData(g_x.List[i], [item.getAttribute("Name"), item.getAttribute("Path")]);
			}
			items = xml.getElementsByTagName("MP");
			if (items.length) {
				g_MP = ED(api.base64_decode(items[0].text, true));
				if (items[0].getAttribute("CRC") != api.CRC32(g_MP)) {
					g_MP = "";
				}
				g_MP0 = g_MP;
			}
			var b = true;
			items = xml.getElementsByTagName("Conf");
			if (items.length) {
				if (items[0].getAttribute("NoExSort")) {
					b = false;
				}
			}
			document.getElementById("!ExSort").checked = b;
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
			root.appendChild(item);
		}
		if (g_MP) {
			var item = xml.createElement("MP");
			item.text = api.base64_encode(ED(g_MP));
			item.setAttribute("CRC", api.CRC32(g_MP));
			root.appendChild(item);
		}
		if (!document.getElementById("!ExSort").checked) {
			var item = xml.createElement("Conf");
			item.setAttribute("NoExSort", true);
			root.appendChild(item);
		}
		xml.appendChild(root);
		SaveXmlEx(Addon_Id + ".xml", xml);
		if (g_MP != g_MP0) {
			var dbfile = fso.BuildPath(te.Data.DataFolder, "config\\wfx_" + (wnw.ComputerName.toLowerCase()) + ".bin");
			try {
				var ado = api.CreateObject("ads");;
				ado.Type = adTypeBinary;
				ado.Open();
				ado.LoadFromFile(dbfile);
				var body = api.CryptUnprotectData(ado.Read(adReadAll), g_MP0, true);
				ado.Close();
			} catch (e) {
				body = "";
			}
			if (body) {
				try {
					var ado = api.CreateObject("ads");
					ado.Type = adTypeBinary;
					ado.Open();
					ado.Write(api.CryptProtectData(body, g_MP));
					ado.SaveToFile(dbfile, adSaveCreateOverWrite);
					ado.Close();
				} catch (e) {}
			}
		}
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
	SetData(sel, [document.E.Name.value, document.E.Path.value]);
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
	var WFX;
	var dllPath = (ExtractMacro(te, api.PathUnquoteSpaces(document.E.Path.value)) + (api.sizeof("HANDLE") > 4 ? "64" : "")).replace(/\.u(wfx64)$/, ".$1");
	var twfxPath = fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), ["addons\\wfx\\twfx", api.sizeof("HANDLE") * 8, ".dll"].join(""));
	var DLL = api.DllGetClassObject(twfxPath, "{5396F915-5592-451c-8811-87314FC0EF11}");
	if (DLL) {
		WFX = DLL.open(dllPath) || {};
	}
	if (bName) {
		document.E.Name.value = WFX.FsGetDefRootName ? WFX.FsGetDefRootName() : fso.GetBaseName(document.E.Path.value);
	}
	var arProp = ["IsUnicode", "FsInit", "FsFindFirst", "FsFindNext", "FsFindClose", "FsSetCryptCallback", "FsGetDefRootName", "FsGetFile", "FsPutFile", "FsRenMovFile", "FsDeleteFile", "FsRemoveDir", "FsMkDir", "FsExecuteFile", "FsSetAttr", "FsSetTime", "FsDisconnect", "FsExtractCustomIcon", "FsSetDefaultParams"];
	var arHtml = [[], [], []];
	for (var i in arProp) {
		arHtml[i % 2].push('<div style="white-space: nowrap"><input type="checkbox" ', WFX[arProp[i]] ? "checked" : "", ' onclick="return false;">', arProp[i].replace(/^Is/, ""), '</div>');
	}
	arHtml[2].push(GetTextR('64-bit'), '<br><input type="text" value="', (ExtractMacro(te, api.PathUnquoteSpaces(document.E.Path.value)) + "64").replace(/\.u(wfx64)$/, ".$1").replace(/"/g, "&quot;"), '" style="width: 100%" readonly><br>');
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

SetMP = function ()
{
	var s = MainWindow.InputDialog("Master Password", "");
	if ((typeof s) == "string" && s != g_MP && confirmOk()) {
		g_MP = s;
		g_Chg.List = true;
	}
}

ED = function (s)
{
	var ar = s.split("").reverse();
	for (var i in ar) {
		ar[i] = String.fromCharCode(ar[i].charCodeAt(0) ^ 13);
	}
	return ar.join("");
}

LoadFS();
var info = GetAddonInfo(Addon_Id);
document.getElementById("_browse1").onclick = function ()
{
	var s = '*.wfx;*.uwfx;*.wfx64';
	RefX('Path', 0, 0, 1, info.Name + '(' + s + ')|' + s);
}
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

