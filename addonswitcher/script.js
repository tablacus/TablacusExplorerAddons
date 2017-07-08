if (window.Addon == 1) {
	AddType("Addon switcher",
	{
		Exec: function (Ctrl, s, type, hwnd, pt)
		{
			bChanged = false;
			var line = s.split(/\n/);
			for (var i in line) {
				var col = line[i].split(/,/);
				var item = GetAddonElement(col[0]);
				var Enabled = col.length > 1 ? api.LowPart(col[1]) : !api.LowPart(item.getAttribute("Enabled"));
				if (Enabled) {
					var AddonFolder = fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), "addons\\" + col[0]);
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
			}
			if (bChanged) {
				RunEvent1("ConfigChanged", "Addons");
				SaveConfig();
				te.Reload();
			}
			return S_OK;
		},

		Ref: function (s, pt)
		{
			var root = te.Data.Addons.documentElement;
			if (root) {
				var items = root.childNodes;
				if (items) {
					var hMenu = api.CreatePopupMenu();
					var arId = [];
					for (var i = 0; i < items.length; i++) {
						var Id = items[i].nodeName;
						arId[i] = Id;
						var info = GetAddonInfo(Id);
						api.InsertMenu(hMenu, i, MF_BYPOSITION | MF_STRING, i + 1, info.Name);
					}
					var nVerb = api.TrackPopupMenuEx(hMenu, TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null);
					api.DestroyMenu(hMenu);
					if (nVerb) {
						return (s ? s + "\n" : "") + items[nVerb - 1].nodeName;
					}
				}
			}
		}

	});
}
