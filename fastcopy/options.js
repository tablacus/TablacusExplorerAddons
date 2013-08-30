var arItems = ["Path", "Copy", "Move", "Delete"];
var arChecks = ["CopyStart", "MoveStart", "DeleteStart"];

function InitOptions()
{
	ApplyLang(document);

	var path = fso.BuildPath(api.GetDisplayNameOf(ssfPROGRAMFILES, SHGDN_FORPARSING), 'FastCopy\\FastCopy.exe');
	if (!fso.FileExists(path)) {
		var path2 = fso.BuildPath(api.GetDisplayNameOf(ssfPROGRAMFILESx86, SHGDN_FORPARSING), 'FastCopy\\FastCopy.exe');
		if (fso.FileExists(path2)) {
			path = path2;
		}
	}
	document.getElementById("defalut_path").title = path;
	info = GetAddonInfo("fastcopy");
	document.title = info.Name;
	var items = te.Data.Addons.getElementsByTagName("fastcopy");
	if (items.length) {
		var item = items[0];
		for (i in arItems) {
			var s = item.getAttribute(arItems[i]);
			document.F.elements[arItems[i]].value = s ? s : "";
		}
		for (i in arChecks) {
			document.F.elements[arChecks[i]].checked = item.getAttribute(arChecks[i]);
		}
	}
	if (api.strcmpi(te.Data.Conf_Lang, "ja") == 0) {
		document.getElementById("GetFastCopy").title = 'http://ipmsg.org/tools/fastcopy.html';
	}
}

function SetOptions()
{
	var items = te.Data.Addons.getElementsByTagName("fastcopy");
	if (items.length) {
		var item = items[0];
		for (i in arItems) {
			var s = document.F.elements[arItems[i]].value;
			if (s.length) {
				item.setAttribute(arItems[i], s);
			}
			else {
				item.removeAttribute(arItems[i]);
			}
		}
		for (i in arChecks) {
			if (document.F.elements[arChecks[i]].checked) {
				item.setAttribute(arChecks[i], true);
			}
			else {
				item.removeAttribute(arChecks[i]);
			}
		}
		TEOk();
	}
	window.close();
}

function SetData(o, s)
{
	if (confirmYN(GetText("Are you sure?"))) {
		document.F.elements[s].value = o.title;
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
			document.getElementById("Path").value = commdlg.FileName;
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
