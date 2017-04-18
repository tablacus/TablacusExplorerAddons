var Addon_Id = "notepadalternative";

if (window.Addon == 1) {
	Addons.NotepadAlternative =
	{
		path: api.PathQuoteSpaces(api.PathUnquoteSpaces(GetAddonOption(Addon_Id, "path"))),
	};

	if (Addons.NotepadAlternative.path) {
		AddEvent("ReplaceMacro", [new RegExp(('^notepad.exe|^"?' + fso.BuildPath(system32, "notepad.exe") + '"?|^"?' + fso.BuildPath(fso.GetSpecialFolder(0).Path, "notepad.exe") + '"?').replace(/([\+\*\.\$\[\-\]\(\)\\])/g, "\\$1") + '|^"[A-Z]:\\\\Program Files\\\\Microsoft Office\\\\OFFICE\\d*\\\\msohtmed\\.exe"', "i"), function(Ctrl)
		{
			return Addons.NotepadAlternative.path;
		}]);
	}
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
