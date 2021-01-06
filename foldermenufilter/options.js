SetTabContents(0, "Hidden", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));

Addons.FolderMenuFilter = {
	AddPath: async function (path) {
		if (!path) {
			return;
		}
		path = await api.PathUnquoteSpaces(path);
		if (await api.GetKeyState(VK_SHIFT) < 0) {
			path = BuildPath("*", await fso.GetFileName(path));
		}
		if (path || path === ssfDESKTOP) {
			const ar = [document.F.Hidden.value.replace(/\s+$/, ""), path];
			document.F.Hidden.value = (ar[0] ? ar.join("\n") : path).replace(/^\s+|\s$/g, "");
		}
	},

	ChooseFolder: async function (o) {
		const pt = await GetPosEx(o, 9);
		this.AddPath(await MainWindow.ChooseFolder(ssfDESKTOP, pt, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING));
	},

	BrowseFolder: async function () {
		this.AddPath(await BrowseForFolder(ssfDESKTOP));
	}
}
