if (window.Addon == 1) {
	Addons.SelectPlus = {
		db: {},

		FO: async function (FV, Items, Dest) {
			let path;
			const nCount = await Items.Count;
			if (nCount == 0) {
				return;
			}
			try {
				path = await Dest.ExtendedProperty("linktarget") || await Dest.Path || Dest;
			} catch (e) {
				path = await Dest.Path || await Dest;
			}
			const db = {
				Flag: SVSI_FOCUSED | SVSI_ENSUREVISIBLE | SVSI_DESELECTOTHERS,
				paths: {},
				dt: new Date().getTime()
			};
			for (let i = 0; i < nCount; ++i) {
				const path1 = BuildPath(path, await fso.GetFileName(await Items.Item(i).Path));
				db.paths[path1] = 1;
			}
			Addons.SelectPlus.db[FV.Id] = db;
			Addons.SelectPlus.Selects(FV, db, 5000);
		},

		Select: function(FV, db, path) {
			setTimeout(function () {
				FV.SelectItem(path, db.Flag | SVSI_SELECT | SVSI_NOTAKEFOCUS);
				db.Flag = 0;
			}, 99);
		},

		Selects: function (FV, db, tm) {
			if (db.tid) {
				clearTimeout(db.tid);
			}
			if (!Addons.SelectPlus.db[FV.Id]) {
				return;
			}
			db.tid = setTimeout(async function () {
				delete db.tid;
				if (!Addons.SelectPlus.db[FV.Id]) {
					return;
				}
				var bDone = true;
				for (var path in db.paths) {
					if (await IsExists(path)) {
						FV.SelectItem(path, db.Flag | SVSI_SELECT | SVSI_NOTAKEFOCUS);
						db.Flag = 0;
						delete db.paths[path];
					} else {
						bDone = false;
					}
				}
				if (bDone || new Date().getTime() - db.dt > 60000) {
					delete Addons.SelectPlus.db[FV.Id];
				} else {
					Addons.SelectPlus.Selects(FV, db, 999);
				}
			}, tm);
		}
	};

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
				Addons.SelectPlus.FO(Ctrl, dataObj, Dest);
			}
		}
	}, true);

	AddEvent("Command", async function (Ctrl, hwnd, msg, wParam, lParam) {
		const nType = await Ctrl.Type;
		if (nType == CTRL_SB || nType == CTRL_EB) {
			if ((wParam & 0xfff) + 1 == CommandID_PASTE) {
				Addons.SelectPlus.FO(Ctrl, await api.OleGetClipboard(), await Ctrl.FolderItem);
			}
		}
	}, true);

	AddEvent("ChangeNotify", async function (Ctrl, pidls, wParam, lParam) {
		let path;
		const lEvent = await pidls.lEvent;
		if (lEvent & (SHCNE_CREATE | SHCNE_MKDIR | SHCNE_UPDATEITEM | SHCNE_UPDATEITEM | SHCNE_UPDATEDIR)) {
			path = await pidls[0].Path;
		} else if (lEvent & (SHCNE_RENAMEITEM | SHCNE_RENAMEFOLDER)) {
			path = await pidls[1].Path;
		}
		if (path) {
			for (let Id in Addons.SelectPlus.db) {
				const FV = await te.Ctrl(CTRL_FV, Id);
				if (FV) {
					const Id = await FV.Id;
					const db = Addons.SelectPlus.db[Id];
					if (db) {
						if (new Date().getTime() - db.dt < 60000) {
							if (db.paths[path]) {
								delete db.paths[path];
								Addons.SelectPlus.Select(FV, db, path);
							}
							if (lEvent & (SHCNE_UPDATEITEM | SHCNE_UPDATEDIR)) {
								if (await FV.FolderItem && path === await FV.FolderItem.Path) {
									delete Addons.SelectPlus.db[Id];
									Addons.SelectPlus.Selects(FV, db, 99);
								}
							}
						} else {
							delete Addons.SelectPlus.db[Id];
						}
					}
				}
			}
		}
	});

	AddEvent("ListViewCreated", async function (Ctrl) {
		delete Addons.SelectPlus.db[await Ctrl.Id];
	});
}
