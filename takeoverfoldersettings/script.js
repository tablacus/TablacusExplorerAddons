var Addon_Id = "takeoverfoldersettings";
if (window.Addon == 1) {
	var item = GetAddonElement(Addon_Id);

	Addons.TakeOverFolderSettings =
	{
		db: "",
		CONFIG: fso.BuildPath(te.Data.DataFolder, "config\\takeoverfoldersettings.txt"),
		Filter: ExtractFilter(item.getAttribute("Filter")) || "?:\\*;\\\\*",
		Disable: ExtractFilter(GetAddonOption(Addon_Id, "Disable") || "-"),
		Lock: api.LowPart(item.getAttribute("Lock"))
	};

	AddEvent("BeforeNavigate", function (Ctrl, fs, wFlags, Prev) {
		if (Ctrl.Type <= CTRL_EB && Ctrl.Data && !Ctrl.Data.Setting) {
			if (!Addons.TakeOverFolderSettings.Lock && Prev && !Prev.Unvailable) {
				var path = Prev.Path;
				if (PathMatchEx(path, Addons.TakeOverFolderSettings.Filter) && !PathMatchEx(path, Addons.TakeOverFolderSettings.Disable)) {
					var col = Ctrl.Columns(2);
					if (col) {
						var db = [Ctrl.CurrentViewMode, Ctrl.IconSize, col, Ctrl.SortColumn(2), Ctrl.GroupBy, Ctrl.SortColumns].join("\t");
						if (db != Addons.TakeOverFolderSettings.db) {
							Addons.TakeOverFolderSettings.db = db;
							Addons.TakeOverFolderSettings.bSave = true;
						}
					}
				}
			}
			var path = (Ctrl.FolderItem || {}).Path;
			if (PathMatchEx(path, Addons.TakeOverFolderSettings.Filter) && !PathMatchEx(path, Addons.TakeOverFolderSettings.Disable)) {
				var ar = Addons.TakeOverFolderSettings.db.split("\t");
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
			var path = Ctrl.FolderItem.Path;
			if (PathMatchEx(path, Addons.TakeOverFolderSettings.Filter) && !PathMatchEx(path, Addons.TakeOverFolderSettings.Disable)) {
				Ctrl.Data.TakeOver = path;
				var ar = Addons.TakeOverFolderSettings.db.split("\t");
				if (ar) {
					Ctrl.CurrentViewMode(ar[0], ar[1]);
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

	try {
		var ado = OpenAdodbFromTextFile(Addons.TakeOverFolderSettings.CONFIG, "utf-8");
		if (ado) {
			Addons.TakeOverFolderSettings.db = ado.ReadText();
			ado.Close();
		}
	} catch (e) { }

	if (!Addons.TakeOverFolderSettings.Lock) {
		Addons.TakeOverFolderSettings.RememberFolder = function (FV) {
			if (FV && FV.FolderItem && !FV.FolderItem.Unvailable) {
				var path = FV.FolderItem.Path;
				if (PathMatchEx(path, Addons.TakeOverFolderSettings.Filter) && !PathMatchEx(path, Addons.TakeOverFolderSettings.Disable) && path == FV.Data.TakeOver) {
					var col = FV.Columns(2);
					if (col) {
						var db = [FV.CurrentViewMode, FV.IconSize, col, FV.SortColumn(2), FV.GroupBy, FV.SortColumns].join("\t");
						if (db != Addons.TakeOverFolderSettings.db) {
							Addons.TakeOverFolderSettings.db = db;
							Addons.TakeOverFolderSettings.bSave = true;
						}
					}
				}
			}
		};
		AddEvent("ChangeView", Addons.TakeOverFolderSettings.RememberFolder);
		AddEvent("CloseView", Addons.TakeOverFolderSettings.RememberFolder);
		AddEvent("Command", Addons.TakeOverFolderSettings.RememberFolder);
		AddEvent("InvokeCommand", function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon) {
			var Ctrl = te.Ctrl(CTRL_FV);
			if (Ctrl) {
				Addons.TakeOverFolderSettings.RememberFolder(Ctrl);
			}
		});

		AddEvent("SaveConfig", function () {
			Addons.TakeOverFolderSettings.RememberFolder(te.Ctrl(CTRL_FV));
			if (Addons.TakeOverFolderSettings.bSave) {
				try {
					var ado = api.CreateObject("ads");
					ado.CharSet = "utf-8";
					ado.Open();
					ado.WriteText(Addons.TakeOverFolderSettings.db);
					ado.SaveToFile(Addons.TakeOverFolderSettings.CONFIG, adSaveCreateOverWrite);
					ado.Close();
					Addons.TakeOverFolderSettings.bSave = false;
				} catch (e) { }
			}
		});
	}
} else {
	var ado = OpenAdodbFromTextFile("addons\\" + Addon_Id + "\\options.html");
	if (ado) {
		SetTabContents(0, "General", ado.ReadText(adReadAll));
		ado.Close();
	}
}
