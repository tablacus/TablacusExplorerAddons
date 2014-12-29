var g_x = {Mouse: null};
var g_Chg = {Mouse: false, Data: null};
g_Types = {Mouse: ["All", "List", "List_Background", "Tree", "Tabs", "Tabs_Background", "Browser"]};
g_nResult = 3;
g_bChanged = false;

function AddMouse(o)
{
	document.F.elements["MouseMouse"].value += o.title;
	ChangeX("Mouse");
}

function SetRadio(o)
{
	var ar = o.id.split("=");
	document.F.elements[ar[0]].value = ar[1];
}

function ShowLocation()
{
	ShowLocationEx({id: "mouse", show: "6", index: "6"});
}

function SetMouseOptions()
{
	SetOptions(function () {
		SetChanged();
		SaveX("Mouse");
		TEOk();
	});
}

LoadLang2(fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), "addons\\mouse\\lang\\" + te.Data.Conf_Lang + ".xml"));
ApplyLang(document);
document.title = GetText("Mouse");
LoadX("Mouse");
AddEventEx(window, "beforeunload", SetMouseOptions);
