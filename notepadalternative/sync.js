const Addon_Id = "notepadalternative";
Common.NotepadAlternative = {
	path: PathQuoteSpaces(PathUnquoteSpaces(GetAddonOption(Addon_Id, "path"))),
};

if (Common.NotepadAlternative.path) {
	AddEvent("ReplaceMacro", [new RegExp(('^notepad.exe|^"?' + fso.BuildPath(system32, "notepad.exe") + '"?|^"?' + fso.BuildPath(fso.GetSpecialFolder(0).Path, "notepad.exe") + '"?').replace(/([\+\*\.\$\[\-\]\(\)\\])/g, "\\$1") + '|^"[A-Z]:\\\\Program Files\\\\Microsoft Office\\\\OFFICE\\d*\\\\msohtmed\\.exe"', "i"), function (Ctrl) {
		return Common.NotepadAlternative.path;
	}]);
}
