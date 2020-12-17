const Addon_Id = "takeoverfoldersettings";
const item = GetAddonElement(Addon_Id);

Sync.TakeOverFolderSettings = {
	db: "",
	CONFIG: BuildPath(te.Data.DataFolder, "config\\takeoverfoldersettings.txt"),
	Filter: ExtractFilter(item.getAttribute("Filter")) || "?:\\*;\\\\*",
	Disable: ExtractFilter(GetAddonOption(Addon_Id, "Disable") || "-"),
	Lock: GetNum(item.getAttribute("Lock"))
};

AddEvent("BeforeNavigate", function (Ctrl, fs, wFlags, Prev) {
	if (Ctrl.Type <= CTRL_EB && Ctrl.Data && !Ctrl.Data.Setting) {
		if (!Sync.TakeOverFolderSettings.Lock && Prev && !Prev.Unvailable) {
			const path = Prev.Path;
			if (PathMatchEx(path, Sync.TakeOverFolderSettings.Filter) && !PathMatchEx(path, Sync.TakeOverFolderSettings.Disable)) {
				const col = Ctrl.Columns(2);
				if (col) {
					const db = [Ctrl.CurrentViewMode, Ctrl.IconSize, col, Ctrl.GetSortColumn(2), Ctrl.GroupBy, Ctrl.SortColumns].join("\t");
					if (db != Sync.TakeOverFolderSettings.db) {
						Sync.TakeOverFolderSettings.db = db;
						Sync.TakeOverFolderSettings.bSave = true;
					}
				}
			}
		}
		const path = (Ctrl.FolderItem || {}).Path;
		if (PathMatchEx(path, Sync.TakeOverFolderSettings.Filter) && !PathMatchEx(path, Sync.TakeOverFolderSettings.Disable)) {
			const ar = Sync.TakeOverFolderSettings.db.split("\t");
			if (ar) {
				fs.ViewMode = ar[0];
				fs.ImageSize = ar[1];
			} else if (Ctrl && Ctrl.Items) {
				fs.ViewMode = Ctrl.CurrentViewMode;
				fs.ImageSize = Ctrl.IconSize;
			}
		}
	}
});

AddEvent("NavigateComplete", function (Ctrl) {
	if (Ctrl.Data && !Ctrl.Data.Setting) {
		Ctrl.Data.Setting = 'TakeOver';
		const path = Ctrl.FolderItem.Path;
		if (PathMatchEx(path, Sync.TakeOverFolderSettings.Filter) && !PathMatchEx(path, Sync.TakeOverFolderSettings.Disable)) {
			Ctrl.Data.TakeOver = path;
			const ar = Sync.TakeOverFolderSettings.db.split("\t");
			if (ar) {
				Ctrl.SetViewMode(ar[0], ar[1]);
				Ctrl.Columns = ar[2];
				if (Ctrl.GroupBy && ar[4]) {
					Ctrl.GroupBy = ar[4];
				}
				if ((ar[5] || "").split(/;/).length > 2 && Ctrl.SortColumns) {
					Ctrl.SortColumns = ar[5];
				} else {
					Ctrl.SortColumn = ar[3];
				}
			}
		}
	}
});

Sync.TakeOverFolderSettings.db = ReadTextFile(Sync.TakeOverFolderSettings.CONFIG);

if (!Sync.TakeOverFolderSettings.Lock) {
	Sync.TakeOverFolderSettings.RememberFolder = function (FV) {
		if (FV && FV.FolderItem && !FV.FolderItem.Unvailable) {
			const path = FV.FolderItem.Path;
			if (PathMatchEx(path, Sync.TakeOverFolderSettings.Filter) && !PathMatchEx(path, Sync.TakeOverFolderSettings.Disable) && path == FV.Data.TakeOver) {
				const col = FV.Columns(2);
				if (col) {
					const db = [FV.CurrentViewMode, FV.IconSize, col, FV.GetSortColumn(2), FV.GroupBy, FV.SortColumns].join("\t");
					if (db != Sync.TakeOverFolderSettings.db) {
						Sync.TakeOverFolderSettings.db = db;
						Sync.TakeOverFolderSettings.bSave = true;
					}
				}
			}
		}
	};
	AddEvent("ChangeView", Sync.TakeOverFolderSettings.RememberFolder);
	AddEvent("CloseView", Sync.TakeOverFolderSettings.RememberFolder);
	AddEvent("Command", Sync.TakeOverFolderSettings.RememberFolder);
	AddEvent("InvokeCommand", function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon) {
		const Ctrl = te.Ctrl(CTRL_FV);
		if (Ctrl) {
			Sync.TakeOverFolderSettings.RememberFolder(Ctrl);
		}
	});

	AddEvent("SaveConfig", function () {
		Sync.TakeOverFolderSettings.RememberFolder(te.Ctrl(CTRL_FV));
		if (Sync.TakeOverFolderSettings.bSave) {
			WriteTextFile(Sync.TakeOverFolderSettings.CONFIG, Sync.TakeOverFolderSettings.db);
			Sync.TakeOverFolderSettings.bSave = false;
		}
	});
}
