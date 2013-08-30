var g_x = {Key: null};
var g_Chg = {Key: false, Data: null};
g_Types = {Key: ["All", "List", "Tree", "Browser"]};

function InitKeyOptions()
{
	ApplyLang(document);
	document.title = GetText("Key");
	LoadX("Key");
	MakeKeySelect();
}

function SetKeyOptions()
{
	ConfirmX();
	SaveX("Key");
	TEOk();
	window.close();
}
