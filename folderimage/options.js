var ado = OpenAdodbFromTextFile("addons\\" + Addon_Id + "\\options.html");
if (ado) {
	var ar = ado.ReadText(adReadAll).split("<!--panel-->");
	SetTabContents(0, "General", ar.shift());
	ar.push('<input type="button" value="Delete" onclick="Addons.FolderImage.Delete()"><br><br>');
	ar.push('<label>Information</label> (<label>', api.sizeof("HANDLE") * 8, '-bit</label>)<div id="Info"></div><br>');
	ar.push('<input type="button" value="', api.sprintf(999, GetText("Get %s..."), "SQLite3"), '" title="http://www.sqlite.org/" onclick="wsh.Run(this.title)">');
	SetTabContents(1, "Cache", ar.join(""));
	ado.Close();
	Addons.FolderImage = {
		Delete: function () {
			if (MainWindow.Addons.FolderImage) {
				MainWindow.Addons.FolderImage.Finalize();
				api.SHFileOperation(FO_DELETE, fso.BuildPath(te.Data.DataFolder, "config\\folderimage.db"), null, 0, false);
			}
		},
		Info: function () {
			var dllPath = api.PathUnquoteSpaces(ExtractMacro(te, document.F.elements["SQLite" + (api.sizeof("HANDLE") * 8)].value) || 'winsqlite3.dll');
			var hDll = api.LoadLibraryEx(dllPath, 0, 0);
			var arProp = ["sqlite3_open", "sqlite3_close", "sqlite3_exec"];
			var arHtml = [];
			for (var i = 0; i < arProp.length; ++i) {
				arHtml.push('<input type="checkbox" ');
				if (api.GetProcAddress(hDll, arProp[i])) {
					arHtml.push("checked");
				}
				arHtml.push(' onclick="return false;">', arProp[i], '<br>');
			}
			api.FreeLibrary(hDll);
			document.getElementById("Info").innerHTML = arHtml.join("");
		}
	}
	setTimeout(Addons.FolderImage.Info, 99);
}
