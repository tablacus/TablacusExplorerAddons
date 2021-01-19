AddType("Addon switcher", {
	Exec: function (Ctrl, s, type, hwnd, pt) {
		bChanged = false;
		const line = s.split(/\n/);
		for (let i in line) {
			const col = line[i].split(/,/);
			const item = GetAddonElement(col[0]);
			let Enabled = col.length > 1 ? GetNum(col[1]) : !GetNum(item.getAttribute("Enabled"));
			if (Enabled) {
				const AddonFolder = BuildPath(te.Data.Installed, "addons", col[0]);
				Enabled = fso.FolderExists(AddonFolder + "\\lang") ? 2 : 0;
				if (fso.FileExists(AddonFolder + "\\script.vbs")) {
					Enabled |= 8;
				}
				if (fso.FileExists(AddonFolder + "\\script.js")) {
					Enabled |= 1;
				}
				Enabled = (Enabled & 9) ? Enabled : 4;
			}
			if (Enabled != item.getAttribute("Enabled")) {
				item.setAttribute("Enabled", Enabled);
				if (!Enabled) {
					AddonDisabled(col[0]);
				}
				bChanged = true;
			}
			const info = GetAddonInfo(col[0]);
			if (info.Level > 0) {
				item.setAttribute("Level", info.Level);
			}
		}
		if (bChanged) {
			RunEvent1("ConfigChanged", "Addons");
			ReloadCustomize();
		}
		return S_OK;
	},

	Ref: function (s, pt) {
		const root = te.Data.Addons.documentElement;
		if (root) {
			const items = root.childNodes;
			if (items) {
				const hMenu = api.CreatePopupMenu();
				const arId = [];
				for (let i = 0; i < items.length; i++) {
					const Id = items[i].nodeName;
					arId[i] = Id;
					api.InsertMenu(hMenu, i, MF_BYPOSITION | MF_STRING, i + 1, GetAddonInfo(Id).Name);
				}
				const nVerb = api.TrackPopupMenuEx(hMenu, TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null);
				api.DestroyMenu(hMenu);
				if (nVerb) {
					return (s ? s + "\n" : "") + items[nVerb - 1].nodeName;
				}
			}
		}
	}
});
