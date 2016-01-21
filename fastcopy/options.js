var arItems = ["Path", "Copy", "Move", "Delete"];
var arChecks = ["CopyStart", "MoveStart", "DeleteStart", "DiffDriveOnly"];

function InitOptionsZ()
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
	document.getElementById("GetFastCopy").value = api.sprintf(999, GetText("Get %s..."), "FastCopy");
	if (/ja/i.test(GetLangId())) {
		document.getElementById("GetFastCopy").title = 'http://ipmsg.org/tools/fastcopy.html';
	}

	SetOnChangeHandler();
	AddEventEx(window, "beforeunload", function ()
	{
		SetOptions(function ()
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
		});
	});
}

function SetDataZ(o, s)
{
	if (confirmYN(GetText("Are you sure?"))) {
		SetValue(document.F.elements[s], o.title);
	}
}
