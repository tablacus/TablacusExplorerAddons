const ar = (await ReadTextFile("addons\\" + Addon_Id + "\\options.html")).split("<!--panel-->");
SetTabContents(0, "General", ar.shift());
ar.splice(1, 0, '<input type="button" value="Delete" onclick="Addons.FolderImage.Delete()"><br><br>');
ar.push('<label>Information</label> (<label>', ui_.bit, '-bit</label>)<div id="Info"></div><br>');
ar.push('<input type="button" value="', await api.sprintf(999, await GetText("Get %s..."), "SQLite3"), '" title="http://www.sqlite.org/" onclick="wsh.Run(this.title)">');
SetTabContents(1, "Cache", ar.join(""));

Addons.FolderImage = {
	Delete: async function () {
		if (await MainWindow.Sync.FolderImage) {
			await MainWindow.Sync.FolderImage.Finalize();
			api.SHFileOperation(FO_DELETE, BuildPath(ui_.DataFolder, "config\\folderimage.db"), null, 0, false);
		}
	},

	Info: async function () {
		const dllPath = await ExtractPath(te, document.F.elements["SQLite" + ui_.bit].value) || 'winsqlite3.dll';
		const hDll = await api.LoadLibraryEx(dllPath, 0, 0);
		const arProp = ["sqlite3_open", "sqlite3_close", "sqlite3_exec"];
		const arHtml = [];
		for (let i = 0; i < arProp.length; ++i) {
			arHtml.push('<input type="checkbox" ');
			if (hDll && await api.GetProcAddress(hDll, arProp[i])) {
				arHtml.push("checked");
			}
			arHtml.push(' onclick="return false;">', arProp[i], '<br>');
		}
		api.FreeLibrary(hDll);
		document.getElementById("Info").innerHTML = arHtml.join("");
	}
}
setTimeout(Addons.FolderImage.Info, 99);
