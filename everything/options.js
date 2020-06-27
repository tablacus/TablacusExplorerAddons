var ado = OpenAdodbFromTextFile("addons\\" + Addon_Id + "\\options.html");
if (ado) {
	SetTabContents(0, "General", ado.ReadText(adReadAll) + '<input type="button" value="' + api.sprintf(999, GetText(" Get % s..."), "Everything") + '" title="http://www.voidtools.com/" onclick="wsh.Run(this.title)">');
	ado.Close();
}
ChangeForm([["__IconSize", "style/display", "none"]]);

SetExe = function () {
	var path = fso.BuildPath(api.GetDisplayNameOf(ssfPROGRAMFILES, SHGDN_FORPARSING), "Everything\\Everything.exe");
	if (!fso.FileExists(path)) {
		path = path.replace(/ \(x86\)\\/, "\\");
	}
	if (fso.FileExists(path) && confirmOk("Are you sure?")) {
		document.F.Exec.value = api.PathQuoteSpaces(path) + " -startup";
	}
}