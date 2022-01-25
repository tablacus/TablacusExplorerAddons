SetTabContents(0, "Hidden", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));

Addons.FolderMenuFilter = {
	AddPath: async function (path) {
		if (!path) {
			return;
		}
		path = PathUnquoteSpaces(path);
		if (await api.GetKeyState(VK_SHIFT) < 0) {
			path = BuildPath("*", GetFileName(path));
		}
		if (path || path === ssfDESKTOP) {
			const ar = [document.F.TextContent.value.replace(/\s+$/, ""), path];
			document.F.TextContent.value = (ar[0] ? ar.join("\n") : path).replace(/^\s+|\s$/g, "");
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

GetXmlAttr = async function (item, n, s) {
	if (n == "TextContent") {
		if (!s) {
			s = ui_.AttrPath;
			if (!s) {
				ui_.AttrPath = await $.GetAddonElement(Addon_Id).getAttribute("Hidden");
				s = ui_.AttrPath;
			}
		}
	}
	return s;
}

SetXmlAttr = async function (item, n, s) {
	if (n == "TextContent") {
		if (ui_.AttrPath) {
			item.removeAttribute("Hidden");
		}
	}
	return s;
}
