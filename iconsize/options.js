returnValue = false;

function InitOptions()
{
	var InstalledFolder = fso.GetParentFolderName(api.GetModuleFileName(null));
	if (external.Data["Conf_IconSize"]) {
		document.F.IconSize.value = external.Data["Conf_IconSize"];
	}
	ApplyLang(document);
}

function SetOptions()
{
	if (document.F.IconSize.value != '') {
		external.Data["Conf_IconSize"] = document.F.IconSize.value;
	}
	else {
		delete external.Data["Conf_IconSize"];
	}
	returnValue = true;
	window.close();
}
