SetTabContents(0, "", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));

Addons.ReplaceCommand = {
	BrowseFile1: async function () {
		const s = document.F.elements["_aqs"].value;
		if (s.indexOf("$1") >= 0) {
			const FV = await GetFolderView();
			const path = await OpenDialog(GetParentFolderName(document.F.elements["_file"].value) || await FV.FolderItem.Path);
			if (path) {
				document.F.elements["_aqs"].value = s.replace("$1", path);
			}
		}
	},

	BrowseFile: async function () {
		const FV = await GetFolderView();
		const path = await OpenDialog(GetParentFolderName(document.F.elements["_file"].value) || await FV.FolderItem.Path);
		if (path) {
			document.F.elements["_file"].value = path;
		}
	},

	BrowseVerb: async function (o) {
		const hMenu = await api.CreatePopupMenu();
		const Item = await this.GetItem();
		const ContextMenu = await api.ContextMenu(Item);
		if (ContextMenu) {
			await ContextMenu.QueryContextMenu(hMenu, 0, 1, 0x7FFF, CMF_EXTENDEDVERBS | CMF_ITEMMENU);
			const mii = await api.Memory("MENUITEMINFO");
			mii.fMask = MIIM_ID;
			for (let i = await api.GetMenuItemCount(hMenu); i--;) {
				await api.GetMenuItemInfo(hMenu, i, true, mii);
				const strVerb = await ContextMenu.GetCommandString(await mii.wID - await ContextMenu.idCmdFirst, GCS_VERB);
				if (!strVerb || !await api.AssocQueryString(ASSOCF_NONE, ASSOCSTR_COMMAND, Item, (strVerb == "default" || !strVerb) ? null : strVerb)) {
					api.DeleteMenu(hMenu, i, MF_BYPOSITION);
				}
			}
			const pt = GetPos(o, 9);
			const nVerb = await api.TrackPopupMenuEx(hMenu, TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, ui_.hwnd, null, ContextMenu);
			document.F.elements["_verb"].value = await ContextMenu.GetCommandString(nVerb - await ContextMenu.idCmdFirst, GCS_VERB) || "default";
		}
		api.DestroyMenu(hMenu);
		this.Get();
	},

	Get: async function () {
		const strVerb = document.F.elements["_verb"].value;
		document.F.elements["_aqs"].value = await api.AssocQueryString(ASSOCF_NONE, ASSOCSTR_COMMAND, await this.GetItem(), (strVerb == "default" || !strVerb) ? null : strVerb);
	},

	SetRE: async function () {
		let s = document.F.elements["_aqs"].value;
		if (!s || /^[\/\|!#]/.test(s)) {
			return;
		}
		let spliter;
		const ar = ["/", "|", "!", "#"];
		for (let i = 0; i < ar.length; i++) {
			spliter = ar[i];
			if (s.indexOf(spliter) < 0) {
				break;
			}
		}
		let sr = s.replace(/([\+\*\.\?\^\$\[\-\]\|\(\)\\])/g, "\\$1");
		let arg = await api.CommandLineToArgv(sr);
		let arg0 = await arg[0];
		const d = /^"/.test(s) ? 2 : 0;
		sr = '^(' + sr.substr(0, arg0.length + d) + ')' + sr.substr(arg0.length + d) + "$";
		arg = api.CommandLineToArgv(s);
		arg0 = await arg[0];
		s = "$1" + s.substr(arg0.length + d);
		document.F.elements["_aqs"].value = spliter + sr + spliter + s + spliter + "i";
	},

	Add: function () {
		const s = document.F.elements["_aqs"].value;
		if (/^[\/\|!#]/.test(s)) {
			const r = document.F.TextContent.value;
			if (!r || /\n$/.test(r)) {
				document.F.TextContent.value += s;
			} else {
				document.F.TextContent.value += "\n" + s;
			}
		}
	},

	GetItem: async function () {
		let Item = document.F.elements["_file"].value;
		if (!Item) {
			const FV = await GetFolderView();
			const Selected = await FV.SelectedItems();
			Item = await Selected.Count ? await Selected.Item(0) : await FV.FolderItem;
		}
		return Item;
	}
}

GetXmlAttr = async function (item, n, s) {
	if (n == "TextContent") {
		if (!s) {
			s = ui_.AttrPath;
			if (!s) {
				ui_.AttrPath = await $.GetAddonElement(Addon_Id).getAttribute("re");
				s = ui_.AttrPath;
			}
		}
	}
	return s;
}

SetXmlAttr = async function (item, n, s) {
	if (n == "TextContent") {
		if (ui_.AttrPath) {
			item.removeAttribute("re");
		}
	}
	return s;
}
