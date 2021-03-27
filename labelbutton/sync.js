const Addon_Id = "labelbutton";
const item = GetAddonElement(Addon_Id);

Sync.LabelButton = {
	Exec: function (Ctrl, pt) {
		Sync.LabelButton.Run(pt, 0);
	},

	Popup: function (Ctrl, pt) {
		Sync.LabelButton.Run(pt, 1);
	},

	Run: function (pt, mode) {
		if (Sync.Label) {
			const oList = {};
			const oList2 = {};
			Sync.Label.List(oList, oList2);
			const hMenu = api.CreatePopupMenu();
			const arList = [];
			const oListPos = {};
			for (let s in oList) {
				arList.push(s);
				oListPos[s] = arList.length;
			}
			if (Sync.LabelButton.Add(hMenu, oList, arList, oListPos) && !mode && arList.length) {
				api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_SEPARATOR, 0, null);
			}
			if (!mode) {
				const FV = te.Ctrl(CTRL_FV);
				if (FV && FV.CurrentViewMode == FVM_DETAILS) {
					if (!/"System\.Contact\.Label"/.test(FV.Columns(1))) {
						api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, 2, GetText("Details"));
					}
				}
				let nRes = Sync.LabelButton.LabelGroup(hMenu, oList, arList, oListPos, 10000);
				if (nRes) {
					api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_SEPARATOR, 0, null);
					nRes = 0;
				}

				let arList2 = [];
				for (let s in oList2) {
					const ar = api.CommandLineToArgv(s);
					if (ar.length > 1) {
						arList2.push(s);
					}
				}
				if (arList2.length) {
					arList2 = arList2.sort(function (a, b) {
						return api.StrCmpLogical(a, b);
					});
					const mii = api.Memory("MENUITEMINFO");
					mii.cbSize = mii.Size;
					mii.fMask = MIIM_STRING | MIIM_SUBMENU | MIIM_STATE;
					mii.hSubMenu = api.CreatePopupMenu();
					mii.dwTypeData = GetText("Filter");
					for (let i in arList2) {
						const s = arList2[i];
						arList.push(s);
						oListPos[s] = arList.length;
						api.InsertMenu(mii.hSubMenu, MAXINT, MF_BYPOSITION | MF_STRING, oListPos[s] + 10000, s.replace(/&/g, "&&"));
					}
					api.InsertMenuItem(hMenu, MAXINT, false, mii);
				}

				for (let s in oList) {
					api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, oListPos[s] + 10000, s.replace(/&/g, "&&"));
				}
			}
			Sync.LabelButton.PopupEx(hMenu, arList, pt)
		}
		return false;
	},

	Add: function (hMenu, oList, arList, oListPos) {
		const FV = te.Ctrl(CTRL_FV);
		if (FV) {
			Selected = FV.SelectedItems();
			if (Selected && Selected.Count) {
				api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, 1, GetText("&Edit"));

				const mii = api.Memory("MENUITEMINFO");
				mii.cbSize = mii.Size;
				mii.fMask = MIIM_STRING | MIIM_SUBMENU | MIIM_STATE;
				mii.fState = MFS_DISABLED;
				mii.hSubMenu = api.CreatePopupMenu();
				mii.dwTypeData = GetText("Add");

				const mii2 = api.Memory("MENUITEMINFO");
				mii2.cbSize = mii.Size;
				mii2.fMask = MIIM_STRING | MIIM_SUBMENU | MIIM_STATE;
				mii2.fState = MFS_DISABLED;
				mii2.hSubMenu = api.CreatePopupMenu();
				mii2.dwTypeData = GetText("Remove");
				const oExists = {};
				for (let i = Selected.Count; i-- > 0;) {
					const path = api.GetDisplayNameOf(Selected.Item(i), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL);
					if (path) {
						const ar = Sync.Label.DB.Get(path).split(/\s*;\s*/);
						for (let j in ar) {
							oExists[ar[j]] = 1;
						}
					}
				}
				for (let s in oList) {
					i = oListPos[s];
					if (oExists[s]) {
						api.InsertMenu(mii2.hSubMenu, MAXINT, MF_BYPOSITION | MF_STRING, i + 30000, s.replace(/&/g, "&&"));
						mii2.fState = MFS_ENABLED;
					}
				}
				let nRes = Sync.LabelButton.LabelGroup(mii.hSubMenu, oList, arList, oListPos, 20000);
				if (nRes) {
					mii.fState = MFS_ENABLED;
				}
				for (let s in oList) {
					if (nRes) {
						api.InsertMenu(mii.hSubMenu, MAXINT, MF_BYPOSITION | MF_SEPARATOR, 0, null);
						nRes = 0;
					}
					api.InsertMenu(mii.hSubMenu, MAXINT, MF_BYPOSITION | MF_STRING, oListPos[s] + 20000, s.replace(/&/g, "&&"));
					mii.fState = MFS_ENABLED;
				}
				api.InsertMenuItem(hMenu, MAXINT, false, mii);
				api.InsertMenuItem(hMenu, MAXINT, false, mii2);
				return true;
			}
		}
	},

	PopupEx: function (hMenu, arList, pt) {
		window.g_menu_click = true;
		const nVerb = api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null);
		const FV = te.Ctrl(CTRL_FV);
		if (nVerb == 1) {
			Sync.Label.Edit(FV, pt);
		}
		if (nVerb == 2) {
			FV.Columns = FV.Columns + ' "System.Contact.Label" -1';
		}
		if (nVerb > 30000) {
			if (confirmOk()) {
				Sync.Label.RemoveItems(Selected, arList[nVerb - 30001]);
			}
		} else if (nVerb > 20000) {
			if (confirmOk()) {
				Sync.Label.AppendItems(Selected, arList[nVerb - 20001]);
			}
		} else if (nVerb > 10000) {
			let path = "label:";
			if (api.GetKeyState(VK_SHIFT) < 0) {
				const res = /^(label:.*)$/.exec(api.GetDisplayNameOf(FV, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL));
				if (res) {
					path = res[1] + (/;/.test(res[1]) ? ";" : " ");
				}
			}
			Navigate(path + arList[nVerb - 10001], GetOpenMode());
		}
		api.DestroyMenu(hMenu);
	},

	LabelGroup: function (hMenu, oList, arList, oListPos, nOffset) {
		let nRes = 0;
		const db = Common.Label.Groups;
		if (db) {
			const mii = api.Memory("MENUITEMINFO");
			mii.cbSize = mii.Size;
			mii.fMask = MIIM_STRING | MIIM_SUBMENU;
			db.ENumCB(function (s, v) {
				mii.hSubMenu = api.CreatePopupMenu();
				mii.dwTypeData = s.replace(/&/g, "&&");
				const ar = v.split(/\s*;\s*/);
				for (let j in ar) {
					nRes++;
					const s1 = ar[j];
					if (!oListPos[s1]) {
						arList.push(s1);
						oListPos[s1] = arList.length;
					}
					api.InsertMenu(mii.hSubMenu, MAXINT, MF_BYPOSITION | MF_STRING, oListPos[s1] + nOffset, s1.replace(/&/g, "&&"));
					delete oList[s1];
				}
				api.InsertMenuItem(hMenu, MAXINT, true, mii);
			});
		}
		return nRes;
	}
};
