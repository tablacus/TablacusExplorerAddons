var ado = OpenAdodbFromTextFile(fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), "addons\\"+ Addon_Id + "\\options.html"));
if (ado) {
    SetTabContents(4, "General", ado.ReadText(adReadAll));
    ado.Close();
}

g_win = MainWindow.g_.OptionsWindow;
g_doc = g_win.document;


SetText = function (o)
{
	g_doc.F[o.name].value = o.value;    
    g_win.g_Chg.Tab = true;
    g_win.g_bChanged = true;
}

SetRadio = function (o)
{
	var ar = o.id.split("=");
	g_doc.F[ar[0]].value = ar[1];
    g_win.g_Chg.Tab = true;
    g_win.g_bChanged = true;
}

SetCheckbox = function (o)
{
	var ar = o.id.split(":");
	if (o.checked) {
		g_doc.F[ar[0]].value |= (api.sscanf(ar[1], "0x%x") || ar[1]);
	} else {
		g_doc.F[ar[0]].value &= ~(api.sscanf(ar[1], "0x%x") || ar[1]);
	}
    g_win.g_Chg.Tab = true;
    g_win.g_bChanged = true;
}

SetCheckbox2 = function (o)
{
	g_doc.F[o.id].checked = o.checked;
}

for(var i = 0; i < document.E.length; i++) {
    var o = document.E[i];
    var ar = o.id.split(":");
    if (ar.length > 1) {
        if (g_doc.F[ar[0]].value & (api.sscanf(ar[1], "0x%x") || ar[1])) {
            document.E[i].checked = true;
        }
    }
}
document.E.Tab_TabWidth.value = g_doc.F.Tab_TabWidth.value;
document.E.Tab_TabHeight.value = g_doc.F.Tab_TabHeight.value;
document.E["Tab_Align=" + (g_doc.F.Tab_Align.value || "0")].checked = true;
document.E.Conf_TabDefault.checked = g_doc.F.Conf_TabDefault.checked;

