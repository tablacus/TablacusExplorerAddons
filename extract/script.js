var Addon_Id = 'extract';

if (window.Addon == 1) {
	AddEvent("Extract", function (Src, Dest)
	{
		var items = te.Data.Addons.getElementsByTagName("extract");
		if (items.length) {
			var item = items[0];
			var s = item.getAttribute("Path");
			if (s) {
				return wsh.Run(ExtractMacro(te, s.replace(/%src%/i, api.PathQuoteSpaces(Src)).replace(/%dest%|%dist%/i, api.PathQuoteSpaces(Dest))), 1, true);
			}
		}
	});
}
else {
	var s = [];
	var path = 'C:\\Program Files\\7-Zip\\7zG.exe';
	var path2 = 'C:\\Program Files (x86)\\7-Zip\\7zG.exe';
	if (!fso.FileExists(path) && fso.FileExists(path2)) {
		path = path2;
	}
	document.getElementById("_7zip").innerHTML = ['<input type="button" title=\'', api.PathQuoteSpaces(path), ' x %src% -o%dest%\' value="7-Zip" onclick="SetExtract(this)"> '].join("");

	path = "C:\\Program Files\\Lhaz\\Lhaz.exe";
	path2 = "C:\\Program Files (x86)\\Lhaz\\Lhaz.exe";
	if (!fso.FileExists(path) && fso.FileExists(path2)) {
		path = path2;
	}
	document.getElementById("_lhaz").innerHTML = ['<input type="button" title=\'', api.PathQuoteSpaces(path), ' /e /d%dest% %src%\' value="Lhaz" onclick="SetExtract(this)"> '].join("");

	SetExtract = function (o)
	{
		if (confirmOk(GetText("Are you sure?"))) {
			document.F.Path.value = o.title;
		}
	}
	InitAddonOptions();
}
