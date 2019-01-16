var Addon_Id = "autobackup";

if (window.Addon == 1) {
	Addons.AutoBackup = {
		SaveConfig: SaveConfig
	}
	SaveConfig = function ()
	{
		Addons.AutoBackup.SaveConfig();

		var item = GetAddonElement("autobackup");
		var dest = api.PathSearchAndQualify(ExtractMacro(te, item.getAttribute("Path") || "%TE_Config%\\..\\backup"));
		var dest1 = fso.BuildPath(dest, api.GetDateFormat(LOCALE_USER_DEFAULT, 0, new Date(), "yyyy-MM-dd"));
		if (!fso.FolderExists(dest1)) {
			CreateFolder(dest1);
			api.SHFileOperation(FO_COPY, fso.BuildPath(te.Data.DataFolder, "config\\*"), dest1, FOF_SILENT | FOF_NOCONFIRMATION | FOF_NORECURSION, false);
			var nItems = api.LowPart(item.getAttribute("Items"));
			if (nItems) {
				var ar = [];
				var wfd = api.Memory("WIN32_FIND_DATA");
				var hFind = api.FindFirstFile(fso.BuildPath(dest, "*"), wfd);
				var bFind = hFind != INVALID_HANDLE_VALUE;
				while (bFind) {
					if (/^\d{4}\-\d{2}\-\d{2}$/.test(wfd.cFileName)) {
						if (fso.FileExists(fso.BuildPath(dest, wfd.cFileName + "\\window.xml"))) {
							ar.unshift(wfd.cFileName);
						}
					}
					bFind = api.FindNextFile(hFind, wfd);
				}
				api.FindClose(hFind);
				if (ar.length > nItems) {
					ar.sort();
					ar.splice(ar.length - nItems);
					for (var i = ar.length; i--;) {
						ar[i] = fso.BuildPath(dest, ar[i]);
					}
					DeleteItem(ar.join("\0"));
				}
			}
		}
	};
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
