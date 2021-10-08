const arItems = ["Path", "Copy", "Move", "Delete"];
const arChecks = ["CopyStart", "MoveStart", "DeleteStart", "DiffDriveOnly"];

SetTabContents(0, "", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));

const arPath = [wsh.ExpandEnvironmentStrings("%USERPROFILE%"), api.GetDisplayNameOf(ssfPROGRAMFILESx86, SHGDN_FORPARSING), api.GetDisplayNameOf(ssfPROGRAMFILES, SHGDN_FORPARSING), wsh.ExpandEnvironmentStrings("%USERPROFILE%")];
let path;
for (let i = arPath.length; i--;) {
	path = BuildPath(await arPath[i], 'FastCopy\\FastCopy.exe');
	if (!i || await fso.FileExists(path)) {
		break;
	}
}
document.getElementById("defalut_path").title = path;
document.title = "FastCopy";
const item = await GetAddonElement("fastcopy");
for (let i in arItems) {
	const s = await item.getAttribute(arItems[i]);
	document.F.elements[arItems[i]].value = s ? s : "";
}
for (let i in arChecks) {
	document.F.elements[arChecks[i]].checked = item.getAttribute(arChecks[i]);
}
document.getElementById("GetFastCopy").value = await api.sprintf(999, await GetText("Get %s..."), "FastCopy");
if (/ja/i.test(await GetLangId())) {
	document.getElementById("GetFastCopy").title = 'https://fastcopy.jp';
}

SetDataZ = async function (o, s, v) {
	SetDefault(document.F.elements[s], v != null ? v : o.title);
}
