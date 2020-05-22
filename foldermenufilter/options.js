var ado = OpenAdodbFromTextFile("addons\\" + Addon_Id + "\\options.html");
if (ado) {
	SetTabContents(0, "Hidden", ado.ReadText(adReadAll));
	ado.Close();
}

Addons.FolderMenuFilter = {
	AddPath: function (path) {
		if (!path) {
			return;
		}
		path = api.PathUnquoteSpaces(path);
		if (api.GetKeyState(VK_SHIFT) < 0) {
			path = fso.BuildPath("*", fso.GetFileName(path));
		}
		if (path || path === ssfDESKTOP) {
			var ar = [document.F.Hidden.value.replace(/\s+$/, ""), path];
			document.F.Hidden.value = (ar[0] ? ar.join("\n") : path).replace(/^\s+|\s$/g, "");
		}
	},

	ChooseFolder: function (o) {
		var pt = GetPos(o, 9);
		this.AddPath(MainWindow.ChooseFolder(ssfDESKTOP, pt, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING));
	},

	BrowseFolder: function () {
		this.AddPath(BrowseForFolder(ssfDESKTOP));
	}
}
