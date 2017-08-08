var Addon_Id = "cmigemo";

var item = GetAddonElement(Addon_Id);

Addons.CMigemo =
{
	Init: function (item)
	{
		var bit = String(api.sizeof("HANDLE") * 8);
		migemo = te.Data.cmigemo || api.DllGetClassObject(fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), "addons\\cmigemo\\tcmigemo" + bit + '.dll'), "{08D62D88-0F74-4a37-9F24-628A385EEC5C}");
		if (migemo) {
			migemo.open(api.PathUnquoteSpaces(ExtractMacro(te, item.getAttribute("dll" + bit))), api.PathUnquoteSpaces(ExtractMacro(te, item.getAttribute("dict"))), item.getAttribute("CP"));
		}
		if (!te.Data.cmigemo) {
			te.Data.cmigemo = migemo;
		}
		return migemo;
	}
}

if (window.Addon == 1) {
	if (!window.migemo) {
		Addons.CMigemo.Init(item);
	}

	AddEvent("AddonDisabled", function (Id)
	{
		if (Id.toLowerCase() == "cmigemo") {
			window.migemo = null;
			te.Data.cmigemo = null;
		}
	});
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}