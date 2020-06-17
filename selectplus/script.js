if (window.Addon == 1) {
	Addons.SelectPlus =
	{
		db: {},

		FO: function (FV, Items, Dest) {
			var path;
			if (Items.Count == 0) {
				return;
			}
			try {
				path = Dest.ExtendedProperty("linktarget") || Dest.Path || Dest;
			} catch (e) {
				path = Dest.Path || Dest;
			}
			var db = {
				Flag: SVSI_FOCUSED | SVSI_ENSUREVISIBLE | SVSI_DESELECTOTHERS,
				paths: {},
				dt: new Date().getTime()
			};
			var bAdd = false;
			for (var i = 0; i < Items.Count; ++i) {
				var path1 = fso.BuildPath(path, fso.GetFileName(Items.Item(i).Path));
				if (IsExists(path1)) {
					FV.SelectItem(path1, db.Flag | SVSI_SELECT | SVSI_NOTAKEFOCUS);
					db.Flag = 0;
				} else {
					db.paths[path1] = 1;
					bAdd = true;
				}
			}
			if (bAdd) {
				Addons.SelectPlus.db[FV.Id] = db;
				Addons.SelectPlus.Selects(FV, db, 5000);
			}
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
			db.tid = setTimeout(function () {
				delete db.tid;
				if (!Addons.SelectPlus.db[FV.Id]) {
					return;
				}
				var bDone = true;
				for (var path in db.paths) {
					if (IsExists(path)) {
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
					Addons.SelectPlus.Selects(FV, db, 5000);
				}
			}, tm);
		}
	};

	AddEvent("Drop", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect) {
		if (Ctrl.Type == CTRL_SB || Ctrl.Type == CTRL_EB) {
			var Dest = Ctrl.HitTest(pt);
			if (Dest) {
				if (!fso.FolderExists(Dest.Path)) {
					if (api.DropTarget(Dest)) {
						return;
					}
					Dest = Ctrl.FolderItem;
				}
			} else {
				Dest = Ctrl.FolderItem;
			}
			if (Dest) {
				Addons.SelectPlus.FO(Ctrl, dataObj, Dest);
			}
		}
	}, true);

	AddEvent("Command", function (Ctrl, hwnd, msg, wParam, lParam) {
		if (Ctrl.Type == CTRL_SB || Ctrl.Type == CTRL_EB) {
			if ((wParam & 0xfff) + 1 == CommandID_PASTE) {
				Addons.SelectPlus.FO(Ctrl, api.OleGetClipboard(), Ctrl.FolderItem);
			}
		}
	}, true);

	AddEvent("ChangeNotify", function (Ctrl, pidls, wParam, lParam) {
		var path;
		if (pidls.lEvent & (SHCNE_CREATE | SHCNE_MKDIR | SHCNE_UPDATEITEM | SHCNE_UPDATEITEM | SHCNE_UPDATEDIR)) {
			path = pidls[0].Path;
		} else if (pidls.lEvent & (SHCNE_RENAMEITEM | SHCNE_RENAMEFOLDER)) {
			path = pidls[1].Path;
		}
		if (path) {
			for (var Id in Addons.SelectPlus.db) {
				var FV = te.Ctrl(CTRL_FV, Id);
				if (FV) {
					var db = Addons.SelectPlus.db[FV.Id];
					if (db) {
						if (new Date().getTime() - db.dt < 60000) {
							if (db.paths[path]) {
								delete db.paths[path];
								Addons.SelectPlus.Select(FV, db, path);
							}
							if (pidls.lEvent & (SHCNE_UPDATEITEM | SHCNE_UPDATEDIR)) {
								if (path === FV.FolderItem.Path) {
									delete Addons.SelectPlus.db[FV.Id];
									Addons.SelectPlus.Selects(FV, db, 99);
								}
							}
						} else {
							delete Addons.SelectPlus.db[FV.Id];
						}
					}
				}
			}
		}
	});

	AddEvent("ListViewCreated", function (Ctrl) {
		delete Addons.SelectPlus.db[Ctrl.Id];
	});
}
