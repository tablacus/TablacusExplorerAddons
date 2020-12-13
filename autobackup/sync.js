AddEvent("SaveConfig",  function () {
	const item = GetAddonElement("autobackup");
	const dest = api.PathSearchAndQualify(ExtractPath(te, item.getAttribute("Path") || "%TE_Config%\\..\\backup"));
	const dest1 = BuildPath(dest, api.GetDateFormat(LOCALE_USER_DEFAULT, 0, new Date().getTime(), "yyyy-MM-dd"));
	if (!fso.FolderExists(dest1)) {
		CreateFolder(dest1);
		api.SHFileOperation(FO_COPY, BuildPath(te.Data.DataFolder, "config\\*"), dest1, FOF_SILENT | FOF_NOCONFIRMATION | FOF_NORECURSION, false);
		const nItems = GetNum(item.getAttribute("Items"));
		if (nItems) {
			const ar = [];
			const wfd = api.Memory("WIN32_FIND_DATA");
			const hFind = api.FindFirstFile(BuildPath(dest, "*"), wfd);
			let bFind = hFind != INVALID_HANDLE_VALUE;
			while (bFind) {
				if (/^\d{4}\-\d{2}\-\d{2}$/.test(wfd.cFileName)) {
					if (fso.FileExists(BuildPath(dest, wfd.cFileName + "\\window.xml"))) {
						ar.unshift(wfd.cFileName);
					}
				}
				bFind = api.FindNextFile(hFind, wfd);
			}
			api.FindClose(hFind);
			if (ar.length > nItems) {
				ar.sort();
				ar.splice(ar.length - nItems);
				for (let i = ar.length; i--;) {
					ar[i] = BuildPath(dest, ar[i]);
				}
				DeleteItem(ar);
			}
		}
	}
});
