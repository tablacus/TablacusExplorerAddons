var Addon_Id = "folderimage";

if (window.Addon == 1) {
	var item = GetAddonElement(Addon_Id);
	Addons.FolderImage =
	{
		hModule: api.LoadLibraryEx(fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), ["addons\\folderimage\\fldrimg", api.sizeof("HANDLE") * 8, ".dll"].join("")), 0, 0),

		ClearCache: function (Crtl, pt) {
			if (Addons.FolderImage.Cache) {
				var FV = GetFolderView(Ctrl, pt);
				var Selected = FV.SelectedItems();
				if (Selected) {
					for (var i = Selected.Count; --i >= 0;) {
						Addons.FolderImage.ClearFolder(Selected.Item(i).Path);
					}
				}
			}
		},

		ClearFolder: function (pid) {
			api.RunDLL(hModule, "ExecSQLite3W", 0, 0, 'DELETE FROM db WHERE folder="' + pid.Path + '";', 1);
			api.RunDLL(hModule, "ExecSQLite3W", 0, 0, 'DELETE FROM db WHERE folder LIKE "' + pid.Path + "\\%" + '";', 1);
		},

		Finalize: function () {
			if (Addons.FolderImage.hModule) {
				te.RemoveEvent("GetImage", api.GetProcAddress(Addons.FolderImage.hModule, "GetImage"));
				api.RunDLL(hModule, "CloseSQLite3W", 0, 0, "", 1);
				api.FreeLibrary(Addons.FolderImage.hModule, 99);
				delete Addons.FolderImage.hModule;
			}
		}
	}
	var hModule = Addons.FolderImage.hModule;
	if (hModule) {
		api.RunDLL(hModule, "SetGetImageW", te.hwnd, 0, api.sprintf(99, "%llx", api.GetProcAddress(null, "GetImage")), 1);
		api.RunDLL(hModule, "SetItemsW", 0, 0, api.LowPart(item.getAttribute("Items")) || 1000, 1);
		api.RunDLL(hModule, "SetExpandedW", 0, 0, api.LowPart(item.getAttribute("Expanded")), 1);
		api.RunDLL(hModule, "SetFilterW", 0, 0, item.getAttribute("Filter") || "*.jpg;*.jpeg;*.png;*.bmp;*.gif;*.ico", 1);
		api.RunDLL(hModule, "SetInvalidW", 0, 0, item.getAttribute("Invalid") || "-", 1);
		Addons.FolderImage.Cache = item.getAttribute("Cache");
		if (Addons.FolderImage.Cache) {
			api.RunDLL(hModule, "OpenSQLite3W", 0, 0, api.PathUnquoteSpaces(ExtractMacro(te, item.getAttribute("SQLite" + (api.sizeof("HANDLE") * 8)))) || "winsqlite3.dll", 1);
			api.RunDLL(hModule, "OpenDBFileW", 0, 0, fso.BuildPath(te.Data.DataFolder, "config\\folderimage.db"), 1);
			api.RunDLL(hModule, "ExecSQLite3W", 0, 0, "CREATE TABLE IF NOT EXISTS db (folder TEXT PRIMARY KEY, image TEXT);", 1);
			AddEvent("ChangeNotify", function (Ctrl, pidls) {
				if (Addons.FolderImage.Cache) {
					if (pidls.lEvent & SHCNE_DELETE) {
						api.RunDLL(hModule, "ExecSQLite3W", 0, 0, 'DELETE FROM db WHERE image="' + pidls[0].Path + '";', 1);
					}
					if (pidls.lEvent & SHCNE_RMDIR) {
						Addons.FolderImage.ClearFolder(pidls[0]);
					}
				}
			});
			AddTypeEx("Add-ons", "Clear folder image cache", Addons.FolderImage.ClearCache);
		}
		te.AddEvent("GetImage", api.GetProcAddress(hModule, "GetImage"));

		AddEvent("Finalize", Addons.FolderImage.Finalize);

		AddEvent("AddonDisabled", function (Id) {
			if (Id.toLowerCase() == "folderimage") {
				Addons.FolderImage.Finalize();
			}
		});
	}
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
