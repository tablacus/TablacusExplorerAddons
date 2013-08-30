var AddonName = "LinkBar";
var nTabIndex = 0;
var nTabMax = 0;
var g_List = null;
var g_Chg = false;
var g_ChgData = false;

function GetCurrentSetting()
{
	var FV = te.Ctrl(CTRL_FV);

	if (confirmYN(GetText("Are you sure?"))) {
		AddPath("Path", api.PathQuoteSpaces(api.GetDisplayNameOf(FV.FolderItem, SHGDN_FORPARSINGEX | SHGDN_FORPARSING)));
	}
}

function AddPath(Id, strValue)
{
	var s = document.getElementById(Id).value;
	if (s.match(/\n$/) || s == "") {
		s += strValue;
	}
	else {
		s += "\n" + strValue;
	}
	document.getElementById(Id).value = s;
}

function InitOptions()
{
	ApplyLang(document);
	document.title = GetText(AddonName);
	LoadX();
}

function SetOptions()
{
	ConfirmX();
	SaveX();
	TEOk();
	window.close();
}

function LoadX()
{
	if (!g_List) {
		g_List = document.F.List;
		g_List.length = 0;
		var path = fso.GetParentFolderName(api.GetModuleFileName(null));
		var xml = te.Data["xml" + AddonName];
		if (!xml) {
			xml = te.CreateObject("Msxml2.DOMDocument");
			xml.async = false;
			xml.load(fso.BuildPath(path, "config\\" + AddonName + ".xml"));
			te.Data["xml" + AddonName] = xml;
		}

		var items = xml.getElementsByTagName("Item");
		var i = items.length;
		g_List.length = i;
		while (--i >= 0) {
			var item = items[i];
			SetData(g_List[i], new Array(item.getAttribute("Name"), item.text, item.getAttribute("Type")));
		}
		xml = null;
	}
}

function SaveX()
{
	if (g_Chg) {
		var xml = te.CreateObject("Msxml2.DOMDocument");
		xml.async = false;
		xml.appendChild(xml.createProcessingInstruction("xml", 'version="1.0" encoding="UTF-8"'));
		var root = xml.createElement("TablacusExplorer");
		var o = document.F.List;
		for (var i = 0; i < o.length; i++) {
			var item = xml.createElement("Item");
			var a = o[i].value.split(g_sep);
			item.setAttribute("Name", a[0]);
			item.text = a[1];
			item.setAttribute("Type", a[2]);
			root.appendChild(item);
		}
		xml.appendChild(root);
		SaveXmlEx(AddonName.toLowerCase() + ".xml", xml);
		te.Data["xml" + AddonName] = xml;
	}
}

function SetData(sel, a)
{
	if (!a[0]) {
		return;
	}
	sel.value = PackData(a);
	sel.text = a[0];
}

function PackData(a)
{
	var i = a.length;
	while (--i >= 0) {
		a[i] = a[i].replace(g_sep, "`  ~");
	}
	return a.join(g_sep);
}

function ClearX()
{
	g_ChgData = false;
}

function ChangeX()
{
	g_ChgData = true;
}

function ConfirmX()
{
	if (g_ChgData && g_List.selectedIndex >= 0) {
		if (confirmYN(GetText("Do you want to replace?"))) {
			ReplaceX();
		}
		ClearX();
	}
}

function EditX()
{
	if (g_List.selectedIndex < 0) {
		return;
	}
	ClearX();
	var a = g_List[g_List.selectedIndex].value.split(g_sep);
	document.F.elements["Name"].value = a[0];
	document.F.elements["Path"].value = a[1];
	o = document.F.elements["Type"];
	i = o.length;
	while (--i >= 0) {
		if (o(i).value == a[2]) {
			o.selectedIndex = i;
			break;
		}
	}
}

function SwitchX()
{
	g_List.style.display = "none";
	g_List = document.F.elements[AddonName + o.value];
	g_List.style.display = "inline";
}

function AddX()
{
	g_List.selectedIndex = ++g_List.length - 1;
	ReplaceX(AddonName);
}

function ReplaceX()
{
	ClearX();
	if (g_List.selectedIndex < 0) {
		return;
	}
	var sel = g_List[g_List.selectedIndex];
	o = document.F.elements["Type"];
	SetData(sel, new Array(document.F.elements["Name"].value, document.F.elements["Path"].value, o[o.selectedIndex].value));
	g_Chg = true;
}

function RemoveX()
{
	ClearX();
	if (g_List.selectedIndex < 0 || !confirmYN(GetText("Are you sure?"))) {
		return;
	}
	g_List[g_List.selectedIndex] = null;
	g_Chg = true;
}

function MoveX(n)
{
	if (g_List.selectedIndex < 0 || g_List.selectedIndex + n < 0 || g_List.selectedIndex + n >= g_List.length) {
		return;
	}
	var src = g_List[g_List.selectedIndex];
	var dist = g_List[g_List.selectedIndex + n];
	var text = dist.text;
	var value = dist.value;
	dist.text = src.text;
	dist.value = src.value;
	src.text = text;
	src.value = value;
	g_List.selectedIndex += n;
	g_Chg = true;
}

function RefX(Id, bMultiLine)
{
	(function (Id, bMultiLine) { setTimeout(function () {
		var commdlg = te.CommonDialog;
		var path = document.getElementById(Id).value;
		var te_path = fso.GetParentFolderName(api.GetModuleFileName(null));
		if (path.substr(0, 3) == "../") {
			path = te_path + (path.substr(2, MAXINT).replace(/\//g, "\\"));
		}
		commdlg.InitDir = path;
		commdlg.Filter = "All Files|*.*";
		commdlg.Flags = OFN_FILEMUSTEXIST;
		if (commdlg.ShowOpen()) {
			ChangeX();
			path = commdlg.FileName;
			if (Id == "Icon") {
				if (api.StrCmpI(te_path, path.substr(0, te_path.length)) == 0) {
					path = ".." + (path.substr(te_path.length, MAXINT).replace(/\\/g, "/"));
				}
			}
			else {
				path = api.PathQuoteSpaces(path);
			}
			if (bMultiLine) {
				AddPath(Id, path);
			}
			else {
				document.getElementById(Id).value = path;
			}
		}
	}, 100);}) (Id, bMultiLine);
}

function ShowLocation()
{
	showModelessDialog("../../script/location.html?linkbar", dialogArguments, 'dialogWidth: 640px; dialogHeight: 480px; resizable: yes; status=0;');
}
