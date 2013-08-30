var arAttr = ["RealFolders", "SpecialFolders", "TakeOver"];

function InitOptions()
{
	var InstalledFolder = fso.GetParentFolderName(api.GetModuleFileName(null));
	LoadLang2(fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), "addons\\openinstead\\lang\\" + te.Data.Conf_Lang + ".xml"));

	ApplyLang(document);
	info = GetAddonInfo("openinstead");
	document.title = info.Name;
	var items = te.Data.Addons.getElementsByTagName("openinstead");
	if (items.length) {
		for (var i in arAttr) {
			document.F.elements[arAttr[i]].checked = items[0].getAttribute(arAttr[i]);
		}
	}
}

function SetOptions()
{
	var items = te.Data.Addons.getElementsByTagName("openinstead");
	if (items.length) {
		for (var i in arAttr) {
			items[0].setAttribute(arAttr[i], document.F.elements[arAttr[i]].checked ? 1 : "");
		}
		TEOk();
	}
	window.close();
}
