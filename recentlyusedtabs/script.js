var Addon_Id = "recentlyusedtabs";

if (window.Addon == 1) {
	var item = GetAddonElement(Addon_Id);

	Addons.RecentlyUsedTabs =
	{
		Exec: function (Ctrl, pt) {
			setTimeout(function () {
				var hMenu = api.CreatePopupMenu();
				if (!pt) {
					pt = api.Memory("POINT");
					api.GetCursorPos(pt);
				}
				var ar = [];
				var TC = te.Ctrl(CTRL_TC);
				for (var i = TC.length; i--;) {
					ar.push(TC[i]);
				}
				ar.sort(function (a, b) {
					return b.Data.nRecent - a.Data.nRecent;
				});
				for (var i = ar.length - 1; i--;) {
					var FV = ar[i];
					var mii = api.Memory("MENUITEMINFO");
					mii.cbSize = mii.Size;
					mii.fMask = MIIM_ID | MIIM_STRING | MIIM_BITMAP | MIIM_FTYPE;
					mii.wId = i + 1;
					mii.dwTypeData = FV.FolderItem.Path;
					AddMenuIconFolderItem(mii, FV.FolderItem);
					api.InsertMenuItem(hMenu, MAXINT, false, mii);
				}
				wsh.SendKeys("{DOWN}");
				var nVerb = api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd,
					null, null);
				if (nVerb) {
					var FV = ar[nVerb - 1];
					TC.SelectedIndex = FV.Index;
				}
			}, 99);
			return S_OK;
		}

	};

	AddEvent("SelectionChanged", function (Ctrl, uChange) {
		var FV;
		if (Ctrl.Type == CTRL_TC) {
			for (var i = Ctrl.Count; i-- > 0;) {
				FV = Ctrl[i];
				if (FV && FV.Data) {
					FV.Data.nRecent = (FV.Data.nRecent || 0) + 1;
				}
			}
			var FV = Ctrl.Selected;
			if (FV && FV.Data) {
				FV.Data.nRecent = 0;
			}
		}
	});

	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.RecentlyUsedTabs.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.RecentlyUsedTabs.Exec, "Func");
	}
	//Type
	AddTypeEx("Add-ons", "Recently used tabs", Addons.RecentlyUsedTabs.Exec);
}
