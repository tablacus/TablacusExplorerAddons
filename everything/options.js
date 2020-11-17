var s = await ReadTextFile("addons\\" + Addon_Id + "\\options.html");
SetTabContents(0, "General", s + '<input type="button" value="' + await api.sprintf(999, await GetText(" Get % s..."), "Everything") + '" title="http://www.voidtools.com/" onclick="wsh.Run(this.title)">');
ChangeForm([["__IconSize", "style/display", "none"]]);

SetExe = async function () {
	var path = BuildPath(await api.GetDisplayNameOf(ssfPROGRAMFILES, SHGDN_FORPARSING), "Everything\\Everything.exe");
	if (!await $.fso.FileExists(path)) {
		path = path.replace(/ \(x86\)\\/, "\\");
	}
	if (await $.fso.FileExists(path) && await confirmOk()) {
		document.F.Exec.value = await api.PathQuoteSpaces(path) + " -startup";
	}
}
