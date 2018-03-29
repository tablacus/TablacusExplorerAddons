var AddonName = "FolderSettings";
var g_Chg = {List: false};

GetCurrentSetting = function (bForce)
{
	var nFormat = api.LowPart(document.F.Format.value);
	var FV = te.Ctrl(CTRL_FV);
	var path = api.GetDisplayNameOf(FV.FolderItem, (nFormat ? 0 : SHGDN_FORADDRESSBAR) | SHGDN_FORPARSING | SHGDN_FORPARSINGEX);
	var s = ["FV.CurrentViewMode(", FV.CurrentViewMode, ",", FV.IconSize, ");\n"];
	s.push("FV.Columns='", FV.Columns(nFormat), "';\n");
	if (!api.ILIsEqual(FV.FolderItem.Alt, ssfRESULTSFOLDER) || FV.FolderItem.ENum) {
		if ((FV.SortColumns || "").split(/;/).length > 2 && !document.F.XP.checked) {
			s.push("FV.SortColumns='", FV.SortColumns, "';\n");
		} else {
			s.push("FV.SortColumn='", FV.SortColumn(nFormat), "';\n");
		}
	}
	s = s.join("");
	if (bForce || confirmOk([path, s].join("\n"))) {
		document.F.Filter.value = path;
		document.F.Path.value = s;
		SetType(document.F.Type, "JScript");
	}
	ChangeX("List");
}

function LoadFS()
{
	if (!g_x.List) {
		var arFunc = [];
		MainWindow.RunEvent1("AddType", arFunc);
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

function EditFS()
{
	if (g_x.List.selectedIndex < 0) {
		return;
	}
	var a = g_x.List[g_x.List.selectedIndex].value.split(g_sep);
	document.F.Filter.value = a[0];
	document.F.Path.value = a[1];
	SetType(document.F.Type, a[2]);
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
	SetData(sel, [document.F.Filter.value, document.F.Path.value, o[o.selectedIndex].value]);
	g_Chg.List = true;
}

ApplyLang(document);
document.title = GetText(AddonName);
LoadFS();
if (dialogArguments.GetCurrent) {
	var bNew = true;
	var FV = te.Ctrl(CTRL_FV);
	var path = api.GetDisplayNameOf(FV.FolderItem, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_FORPARSINGEX);
	var path2 = api.GetDisplayNameOf(FV.FolderItem, SHGDN_FORPARSING | SHGDN_FORPARSINGEX);
	if (path != path2) {
		path += ";" + path2;
	}
	for (var i = g_x.List.length; i-- > 0;) {
		var a = g_x.List[i].value.split(g_sep);
		if (api.PathMatchSpec(a[0], path)) {
			g_x.List.selectedIndex = i;
			EditFS();
			bNew = false;
			break;
		}
	}
	if (bNew) {
		GetCurrentSetting(true);
	}
}
SetOnChangeHandler();
AddEventEx(window, "beforeunload", function ()
{
	SetOptions(function ()
	{
		if (g_Chg.Data) {
			ReplaceFS();
		}
		SaveFS();
	});
});
