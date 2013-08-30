function InitOptions()
{
	var InstalledFolder = fso.GetParentFolderName(api.GetModuleFileName(null));

	ApplyLang(document);
	info = GetAddonInfo("extract");
	document.title = info.Name;
	var items = te.Data.Addons.getElementsByTagName("extract");
	if (items.length) {
		var item = items[0];
		var s = item.getAttribute("Path");
		document.F.Path.value = s ? s : "";
	}
}

function SetOptions()
{
	var items = te.Data.Addons.getElementsByTagName("extract");
	if (items.length) {
		var item = items[0];
		var s = document.F.Path.value;
		if (s.length) {
			item.setAttribute("Path", s);
		}
		else {
			item.removeAttribute("Path");
		}
		TEOk();
	}
	window.close();
}

function AddButtons()
{
	var s = "";
	var path = 'C:\\Program Files\\7-Zip\\7zG.exe';
	var path2 = 'C:\\Program Files (x86)\\7-Zip\\7zG.exe';
	if (!fso.FileExists(path) && fso.FileExists(path2)) {
		path = path2;
	}
	s += '<input type="button" title=\'' + api.PathQuoteSpaces(path) + ' x %src% -o%dest%\' value="7-Zip" onclick="SetExtract(this)"> ';

	path = "C:\\Program Files\\Lhaz\\Lhaz.exe";
	path2 = "C:\\Program Files (x86)\\Lhaz\\Lhaz.exe";
	if (!fso.FileExists(path) && fso.FileExists(path2)) {
		path = path2;
	}
	s += '<input type="button" title=\'' + api.PathQuoteSpaces(path) + ' /e /d%dest% %src%\' value="Lhaz" onclick="SetExtract(this)"> ';
	document.write(s);
}

function SetExtract(o)
{
	if (confirmYN(GetText("Are you sure?"))) {
		document.F.Path.value = o.title;
	}
}

function Ref()
{
	setTimeout(function ()
	{
		var commdlg = te.CommonDialog;
		var arg = api.CommandLineToArgv(document.getElementById("Path").value);
		commdlg.InitDir = fso.GetParentFolderName(arg.Item(0));
		commdlg.Filter = "All Files|*.*";
		commdlg.Flags = OFN_FILEMUSTEXIST;
		if (commdlg.ShowOpen()) {
			var ar = [api.PathQuoteSpaces(commdlg.FileName)];
			for (var i = 1; i < arg.Count; i++) {
				ar.push(api.PathQuoteSpaces(arg.Item(i)));
			}
			document.getElementById("Path").value = ar.join(" ");
		}
	}, 100);
}

function SetProtable()
{
	if (confirmYN(GetText("Are you sure?"))) {
		var o = document.getElementById("Path");
		o.value = o.value.replace(new RegExp(fso.GetDriveName(api.GetModuleFileName(null)), "i"), '%Installed%');
	}
}
