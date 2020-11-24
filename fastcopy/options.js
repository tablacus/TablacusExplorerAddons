var arItems = ["Path", "Copy", "Move", "Delete"];
var arChecks = ["CopyStart", "MoveStart", "DeleteStart", "DiffDriveOnly"];

SetTabContents(0, "", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));

var arPath = [wsh.ExpandEnvironmentStrings("%USERPROFILE%"), api.GetDisplayNameOf(ssfPROGRAMFILESx86, SHGDN_FORPARSING), api.GetDisplayNameOf(ssfPROGRAMFILES, SHGDN_FORPARSING), wsh.ExpandEnvironmentStrings("%USERPROFILE%")];
var path;
for (var i = arPath.length; i--;) {
	path = BuildPath(await arPath[i], 'FastCopy\\FastCopy.exe');
	if (!i || await fso.FileExists(path)) {
		break;
	}
}
document.getElementById("defalut_path").title = path;
info = await GetAddonInfo("fastcopy");
document.title = await info.Name;
var item = await GetAddonElement("fastcopy");
for (i in arItems) {
	var s = await item.getAttribute(arItems[i]);
	document.F.elements[arItems[i]].value = s ? s : "";
}
for (i in arChecks) {
	document.F.elements[arChecks[i]].checked = item.getAttribute(arChecks[i]);
}
document.getElementById("GetFastCopy").value = await api.sprintf(999, await GetText("Get %s..."), "FastCopy");
if (/ja/i.test(await GetLangId())) {
	document.getElementById("GetFastCopy").title = 'https://fastcopy.jp';
}

SetDataZ = async function (o, s) {
	if (await confirmOk()) {
		SetValue(document.F.elements[s], o.title);
	}
}
