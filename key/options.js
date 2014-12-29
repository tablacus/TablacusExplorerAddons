var g_x = {Key: null};
var g_Chg = {Key: false, Data: null};
g_Types = {Key: ["All", "List", "Tree", "Browser"]};
g_nResult = 3;
g_bChanged = false;

function SetKeyOptions()
{
	SetOptions(function () {
		SetChanged();
		SaveX("Key");
		TEOk();
	});
}

ApplyLang(document);
document.title = GetText("Key");
LoadX("Key");
MakeKeySelect();
AddEventEx(window, "beforeunload", SetKeyOptions);
