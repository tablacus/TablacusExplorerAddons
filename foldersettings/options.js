returnValue = false;

var AddonName = "FolderSettings";
var g_List = null;
var g_Chg = false;

function GetCurrentSetting()
{
	var FV = te.Ctrl(CTRL_FV);
	var path = api.GetDisplayNameOf(FV.FolderItem, SHGDN_FORPARSINGEX | SHGDN_FORPARSING);

	var s = "Ctrl.CurrentViewMode=" + FV.CurrentViewMode + ";\n";
	s += "Ctrl.IconSize=" + FV.IconSize + ";\n";
	s += "Ctrl.Columns='" + FV.Columns + "';\n";
	s += "Ctrl.SortColumn='" + FV.SortColumn + "';\n";
	if (confirm(path + "\n" + s)) {
		document.F.elements["Filter"].value = path;
		document.F.elements["Path"].value = s;
	}
}

function InitOptions()
{
	ApplyLang(document);
	document.title = GetText(AddonName);
	LoadX();
}

function SetOptions()
{
	SaveX();
	window.close();
}

function LoadX()
{
	if (!g_List) {
		g_List = document.F.List;
		g_List.length = 0;
		var xml = te.Data["xml" + AddonName];
		if (!xml) {
			xml = OpenXml(AddonName + ".xml", false, false);
			te.Data["xml" + AddonName] = xml;
		}
		var items = xml.getElementsByTagName("Item");
		var i = items.length;
		g_List.length = i;
		while (--i >= 0) {
			var item = items[i];
			SetData(g_List[i], new Array(item.getAttribute("Filter"), item.text, item.getAttribute("Type")));
		}
		xml = null;
	}
}

function SaveX()
{
	if (g_Chg) {
		var xml = CreateXml();
		var root = xml.createElement("TablacusExplorer");
		var o = document.F.List;
		for (var i = 0; i < o.length; i++) {
			var item = xml.createElement("Item");
			var a = o[i].value.split(g_sep);
			item.setAttribute("Filter", a[0]);
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

function EditX()
{
	if (g_List.selectedIndex < 0) {
		return;
	}
	var a = g_List[g_List.selectedIndex].value.split(g_sep);
	document.F.elements["Filter"].value = a[0];
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
	if (g_List.selectedIndex < 0) {
		return;
	}
	var sel = g_List[g_List.selectedIndex];
	o = document.F.elements["Type"];
	SetData(sel, new Array(document.F.elements["Filter"].value, document.F.elements["Path"].value, o[o.selectedIndex].value));
	g_Chg = true;
}

function RemoveX()
{
	if (g_List.selectedIndex < 0 || !confirm(GetText("Are you sure?"))) {
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

