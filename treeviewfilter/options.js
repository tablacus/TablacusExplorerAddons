var ado = OpenAdodbFromTextFile("addons\\" + Addon_Id + "\\options.html");
if (ado) {
	SetTabContents(0, "Hidden", ado.ReadText(adReadAll));
	ado.Close();
}

Addons.TreeViewFilter = {
	AddPath: function (path) {
		if (!path) {
			return;
		}
		path = api.GetDisplayNameOf(path, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
		if (api.GetKeyState(VK_SHIFT) < 0) {
			path = fso.BuildPath("*", fso.GetFileName(path));
		}
		if (path) {
			var ar = [document.F.Hidden.value.replace(/\s+$/, ""), path];
			document.F.Hidden.value = (ar[0] ? ar.join("\n") : path).replace(/^\s+|\s$/g, "");
		}
	},

	BrowseForFolder: function () {
		var pid = sha.BrowseForFolder(0, GetText("Filter"), 0x50);
		if (pid) {
			this.AddPath(pid.Self);
		}
	},

	BrowseFolder: function () {
		this.AddPath(BrowseForFolder(ssfDESKTOP));
	}
}
