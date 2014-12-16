returnValue = false;

var AddonName = "FolderSettings";
var g_Chg = {List: false};

function GetCurrentSetting()
{
	var FV = te.Ctrl(CTRL_FV);
	var path = api.GetDisplayNameOf(FV.FolderItem, SHGDN_FORPARSINGEX | SHGDN_FORPARSING);

	var s = ["Ctrl.CurrentViewMode=", FV.CurrentViewMode, ";\n"];
	s.push("Ctrl.IconSize=", FV.IconSize, ";\n");
	s.push("Ctrl.Columns='", FV.Columns, "';\n");
	s.push("Ctrl.SortColumn='", FV.SortColumn, "';\n");
	s = s.join("");
	if (confirmOk([path, s].join("\n"))) {
		document.F.Filter.value = path;
		document.F.Path.value = s;
		SetType(document.F.Type, "JScript");
	}
}

function SetOptions()
{
	SaveFS();
	window.close();
}

function LoadFS()
{
	if (!g_x.List) {
		var arFunc = [];
		for (var i in MainWindow.eventTE.AddType) {
			MainWindow.eventTE.AddType[i](arFunc);
		}
		var oa = document.F.Type;
		for (var i = 0; i < arFunc.length; i++) {
			var o = oa[++oa.length - 1];
			o.value = arFunc[i];
			o.innerText = GetText(arFunc[i]);
		}
		g_x.List = document.F.List;
		g_x.List.length = 0;
		var nSelectSize = g_x.List.size;
		var xml = te.Data["xml" + AddonName];
		if (!xml) {
			xml = OpenXml(AddonName + ".xml", false, false);
			te.Data["xml" + AddonName] = xml;
		}
		if (xml) {
			var items = xml.getElementsByTagName("Item");
			var i = items.length;
			g_x.List.length = i;
			while (--i >= 0) {
				var item = items[i];
				SetData(g_x.List[i], [item.getAttribute("Filter"), item.text, item.getAttribute("Type")]);
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

function EditFS()
{
	if (g_x.List.selectedIndex < 0) {
		return;
	}
	var a = g_x.List[g_x.List.selectedIndex].value.split(g_sep);
	document.F.elements["Filter"].value = a[0];
	document.F.elements["Path"].value = a[1];
	SetType(document.F.Type, a[2]);
}

function ReplaceFS()
{
	if (g_x.List.selectedIndex < 0) {
		return;
	}
	var sel = g_x.List[g_x.List.selectedIndex];
	o = document.F.elements["Type"];
	SetData(sel, new Array(document.F.elements["Filter"].value, document.F.elements["Path"].value, o[o.selectedIndex].value));
	g_Chg.List = true;
}

ApplyLang(document);
document.title = GetText(AddonName);
LoadFS();
