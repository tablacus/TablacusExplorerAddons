var ado = OpenAdodbFromTextFile("addons\\" + Addon_Id + "\\options.html", "utf-8");
if (ado) {
	var ar = ado.ReadText(adReadAll).split("<!--panel-->");
	SetTabContents(0, "Filter", ar[0]);
	SetTabContents(1, "Path", ar[1]);
	SetTabContents(2, "@shell32.dll,-12852", ar[2]);
	ado.Close();
}
var el = document.getElementById("_7zip");
el.value = api.sprintf(99, GetText("Get %s..."), "7-Zip");

if (api.sizeof("HANDLE") == 4) {
	var strPath = "C:\\Program Files (x86)\\7-Zip\\7z.dll";
	var hDll = api.LoadLibraryEx(strPath, 0, 0);
	if (hDll) {
		api.FreeLibrary(hDll);
		document.F.Dll32.setAttribute("placeholder", strPath);
		strPath = "C:\\Program Files (x86)\\7-Zip\\7zG.exe";
		if (fso.FileExists(strPath)) {
			document.F.Exe32.setAttribute("placeholder", strPath);
		}
	}
}
