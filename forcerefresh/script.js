const Addon_Id = "forcerefresh";
if (window.Addon == 1) {
	const item = await GetAddonElement(Addon_Id);
	Addons.ForceRefresh = {
		Filter: await ExtractFilter(item.getAttribute("Filter") || "-"),
		Disable: await ExtractFilter(item.getAttribute("Disable") || "-"),
		Notify: 0,
		Timeout: GetNum(item.getAttribute("Timeout")) || 500,
		Tab: GetNum(item.getAttribute("Tab")),
		Check: GetNum(item.getAttribute("Items")) ? 2 : 1,
		db: {},
		tid: {},

		Refresh: async function (FV) {
			const Id = await FV.Id;
			if (Addons.ForceRefresh.tid[Id]) {
				clearTimeout(Addons.ForceRefresh.tid[Id]);
			}
			Addons.ForceRefresh.tid[Id] = setTimeout(async function (Id) {
				delete Addons.ForceRefresh.tid[Id];
				if (await api.GetClassName(await api.GetFocus()) != WC_EDIT) {
					FV.Refresh(Addons.ForceRefresh.Check);
				}
			}, Addons.ForceRefresh.Timeout, Id);
		},

		ChangeNotify: async function (FV, pidls, lEvent) {
			let r = [api.GetDisplayNameOf(FV, SHGDN_FORPARSING), api.GetDisplayNameOf(await pidls[0], SHGDN_FORPARSING)];
			if (lEvent & SHCNE_RENAMEITEM | SHCNE_RENAMEFOLDER) {
				r.push(api.GetDisplayNameOf(await pidls[1], SHGDN_FORPARSING));
			}
			r = await Promise.all(r);
			if (!await PathMatchEx(r[0], Addons.ForceRefresh.Filter) || await PathMatchEx(r[0], Addons.ForceRefresh.Disable)) {
				return;
			}
			const res0 = /^([a-z]):\\|^\\\\\w/i.exec(r[0]);
			if (!res0) {
				return;
			}
			if (res0[1]) {
				for (let i = r.length; i--;) {
					if (!await IsCloudPath(r[i])) {
						const h = await api.CreateFile(r[i], 0x80000000, 7, null, 3, 0x02000000, null);
						if (h != INVALID_HANDLE_VALUE) {
							const path = await api.GetFinalPathNameByHandle(h, 0);
							api.CloseHandle(h);
							if (path) {
								r[i] = path;
							}
						}
					}
					r[i] = (r[i] || "").toLowerCase();
				}
			}
			if (r[0] == GetParentFolderName(r[1]) ||
				((lEvent & SHCNE_UPDATEITEM | SHCNE_UPDATEDIR) && r[0] == r[1]) ||
				(r.length > 2 && r[0] == GetParentFolderName(r[2]))) {
				Addons.ForceRefresh.Refresh(FV);
			}
		},

		FO: async function (Dest) {
			const path = await api.GetDisplayNameOf(FV, SHGDN_FORPARSING);
			if (!await PathMatchEx(path, Addons.ForceRefresh.Filter) || await PathMatchEx(path, Addons.ForceRefresh.Disable)) {
				return;
			}
			const cFV = await te.Ctrls(CTRL_FV, false, window.chrome);
			for (let i = cFV.length; --i >= 0;) {
				if (await api.ILIsEqual(cFV[i], Dest)) {
					Addons.ForceRefresh.Refresh(cFV[i]);
				}
			}
		}
	};

	let db = {
		"NewFile": SHCNE_CREATE,
		"NewFolder": SHCNE_MKDIR,
		"Delete": SHCNE_DELETE | SHCNE_RMDIR,
		"Rename": SHCNE_RENAMEITEM | SHCNE_RENAMEFOLDER,
		"Update": SHCNE_UPDATEITEM | SHCNE_UPDATEDIR
	}
	for (let n in db) {
		if (GetNum(item.getAttribute(n))) {
			Addons.ForceRefresh.Notify |= db[n];
		}
	}
	delete db;
	if (Addons.ForceRefresh.Notify) {
		AddEvent("ChangeNotify", async function (Ctrl, pidls) {
			const lEvent = await pidls.lEvent;
			if (lEvent & Addons.ForceRefresh.Notify) {
				const cFV = await te.Ctrls(CTRL_FV, false, window.chrome);
				for (let i = cFV.length; --i >= 0;) {
					Addons.ForceRefresh.ChangeNotify(cFV[i], pidls, lEvent);
				}
			}
		});
	}


	if (Addons.ForceRefresh.Drop) {
		AddEvent("Drop", async function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
			const nType = await Ctrl.Type;
			if (nType == CTRL_SB || nType == CTRL_EB) {
				let Dest = await Ctrl.HitTest(pt);
				if (Dest) {
					if (!await fso.FolderExists(await Dest.Path)) {
						if (await api.DropTarget(Dest)) {
							return;
						}
						Dest = await Ctrl.FolderItem;
					}
				} else {
					Dest = await Ctrl.FolderItem;
				}
				if (Dest) {
					Addons.ForceRefresh.FO(Dest);
				}
			}
		}, true);
	}

	if (Addons.ForceRefresh.Paste) {
		AddEvent("Command", async function (Ctrl, hwnd, msg, wParam, lParam) {
			const nType = await Ctrl.Type;
			if (nType == CTRL_SB || nType == CTRL_EB) {
				if ((wParam & 0xfff) + 1 == CommandID_PASTE) {
					Addons.ForceRefresh.FO(await Ctrl.FolderItem);
				}
			}
		}, true);
	}

	if (Addons.ForceRefresh.Tab) {
		AddEvent("SelectionChanged", async function (Ctrl, uChange) {
			if (await Ctrl.Type == CTRL_TC) {
				if (await Ctrl.Selected) {
					const Id = await Ctrl.Id;
					const FV = await te.Ctrl(CTRL_FV, Addons.ForceRefresh.db[Id]);
					if (FV) {
						const Id = await Ctrl.Selected.Id;
						if (await FV.Id != Id) {
							const path = await api.GetDisplayNameOf(await Ctrl.Selected, SHGDN_FORPARSING);
							if (await PathMatchEx(path, Addons.ForceRefresh.Filter) && !await PathMatchEx(path, Addons.ForceRefresh.Disable)) {
								if (Addons.ForceRefresh.tid[Id]) {
									clearTimeout(Addons.ForceRefresh.tid[Id]);
									delete Addons.ForceRefresh.tid[Id];
								}
								Ctrl.Selected.Refresh(Addons.ForceRefresh.Check);
							}
						}
					}
					Addons.ForceRefresh.db[Id] = await Ctrl.Selected.Id;
				}
			}
		});
	}
} else {
	const ar = (await ReadTextFile("addons\\" + Addon_Id + "\\options.html")).split(/<!--panel-->/);
	SetTabContents(0, "General", ar[0]);
	SetTabContents(1, await GetText("@wmploc.DLL,-7853[Monitored Folders]"), ar[1]);
}
