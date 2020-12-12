const Addon_Id = "folderimage";
const item = GetAddonElement(Addon_Id);

Sync.FolderImage = {
	hModule: api.LoadLibraryEx(BuildPath(te.Data.Installed, "addons\\folderimage\\fldrimg" + (api.sizeof("HANDLE") * 8) + ".dll"), 0, 0),

	ClearCache: function (Crtl, pt) {
		if (Sync.FolderImage.Cache) {
			const FV = GetFolderView(Ctrl, pt);
			const Selected = FV.SelectedItems();
			if (Selected) {
				for (let i = Selected.Count; --i >= 0;) {
					Sync.FolderImage.ClearFolder(Selected.Item(i).Path);
				}
			}
		}
	},

	ClearFolder: function (pid) {
		api.RunDLL(hModule, "ExecSQLite3W", 0, 0, 'DELETE FROM db WHERE folder="' + pid.Path + '";', 1);
		api.RunDLL(hModule, "ExecSQLite3W", 0, 0, 'DELETE FROM db WHERE folder LIKE "' + pid.Path + "\\%" + '";', 1);
	},

	Finalize: function () {
		if (Sync.FolderImage.hModule) {
			te.RemoveEvent("GetImage", api.GetProcAddress(Sync.FolderImage.hModule, "GetImage"));
			api.RunDLL(hModule, "CloseSQLite3W", 0, 0, "", 1);
			api.FreeLibrary(Sync.FolderImage.hModule, 99);
			delete Sync.FolderImage.hModule;
		}
	}
}
const hModule = Sync.FolderImage.hModule;
if (hModule) {
	api.RunDLL(hModule, "SetGetImageW", te.hwnd, 0, api.sprintf(99, "%llx", api.GetProcAddress(null, "GetImage")), 1);
	api.RunDLL(hModule, "SetItemsW", 0, 0, GetNum(item.getAttribute("Items")) || 1000, 1);
	api.RunDLL(hModule, "SetExpandedW", 0, 0, GetNum(item.getAttribute("Expanded")), 1);
	api.RunDLL(hModule, "SetFilterW", 0, 0, item.getAttribute("Filter") || "*.jpg;*.jpeg;*.png;*.bmp;*.gif;*.ico", 1);
	api.RunDLL(hModule, "SetInvalidW", 0, 0, item.getAttribute("Invalid") || "-", 1);
	Sync.FolderImage.Cache = item.getAttribute("Cache");
	if (Sync.FolderImage.Cache) {
		api.RunDLL(hModule, "OpenSQLite3W", 0, 0, api.PathUnquoteSpaces(ExtractMacro(te, item.getAttribute("SQLite" + (api.sizeof("HANDLE") * 8)))) || "winsqlite3.dll", 1);
		api.RunDLL(hModule, "OpenDBFileW", 0, 0, BuildPath(te.Data.DataFolder, "config\\folderimage.db"), 1);
		api.RunDLL(hModule, "ExecSQLite3W", 0, 0, "CREATE TABLE IF NOT EXISTS db (folder TEXT PRIMARY KEY, image TEXT);", 1);
		AddEvent("ChangeNotify", function (Ctrl, pidls) {
			if (Sync.FolderImage.Cache) {
				if (pidls.lEvent & SHCNE_DELETE) {
					api.RunDLL(hModule, "ExecSQLite3W", 0, 0, 'DELETE FROM db WHERE image="' + pidls[0].Path + '";', 1);
				}
				if (pidls.lEvent & SHCNE_RMDIR) {
					Sync.FolderImage.ClearFolder(pidls[0]);
				}
			}
		});
		AddTypeEx("Add-ons", "Clear folder image cache", Sync.FolderImage.ClearCache);
	}
	te.AddEvent("GetImage", api.GetProcAddress(hModule, "GetImage"));

	AddEvent("Finalize", Sync.FolderImage.Finalize);

	AddEvent("AddonDisabled", function (Id) {
		if (Id.toLowerCase() == "folderimage") {
			Sync.FolderImage.Finalize();
		}
	});
}
