if (window.Addon == 1) {
	AddType("Folder list menu",
	{
		Exec: function (Ctrl, s, type, hwnd, pt)
		{
			var FV = GetFolderView(Ctrl, pt);
			if (FV) {
				FV.Focus();
			}
			var hMenu = api.CreatePopupMenu();
			var items = [];
			s = api.PathUnquoteSpaces(s);
			var ado = OpenAdodbFromTextFile(s);
			var Parent = fso.GetParentFolderName(s);
			var res, Name = "";
			var mii = api.Memory("MENUITEMINFO");
			mii.cbSize = mii.Size;
			mii.fMask = MIIM_ID | MIIM_BITMAP | MIIM_SUBMENU | MIIM_DATA | MIIM_STRING;
			MenusIcon(mii, "icon:shell32.dll,3,16");
			while (!ado.EOS) {
				var path = api.PathUnquoteSpaces(ado.ReadText(adReadLine));
				if (/^#/.test(path)) {
					res = /#EXTINF:[\d\s\-]+,\s*(.*)/i.exec(path);
					if (res) {
						Name = res[1];
					}
					continue;
				}
				res = /^(.*?)[\s\-]*\t(.*)$/.exec(path) || /^(.*?)[\s\-]*([a-z]:\\.*)$/i.exec(path) || /^(.*?)[\s\-]*(\\\\.*)$/.exec(path) || /^(.*?)[\s\-]*(::{.*)$/.exec(path) || /^(.*?)[\s\-]*([a-z]+:\/\/.*)$/.exec(path);
				if (res) {
					if (res[1]) {
						Name = res[1];
						path = res[2];
					}
				} else {
					path = fso.BuildPath(Parent, path);
				}
				items.push(path);
				mii.dwTypeData = Name || fso.GetFileName(path);
				mii.wID = items.length;
				api.InsertMenuItem(hMenu, MAXINT, false, mii);
				Name = "";
			}
			ado.Close();
			if (!pt) {
				var pt = GetPos(Ctrl, true, false, false, true);
				if (Ctrl.Type) {
					api.GetCursorPos(pt);
				}
			}
			window.g_menu_click = true;
			var nVerb = api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null);
			api.DestroyMenu(hMenu);
			if (nVerb) {
				var path = items[nVerb - 1];
				switch (window.g_menu_button - 0) {
					case 2:
						PopupContextMenu(path);
						break;
					case 3:
						Navigate(path, SBSP_NEWBROWSER);
						break;
					default:
						Navigate(path, OpenMode);
						break;
				}
			}
			return S_OK;
		},

		Ref: OpenDialog
	});
}
