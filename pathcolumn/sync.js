Sync.PathColumn = {
	Get: {
		"System.ItemPathDisplay": function (FV, pid, s) {
			if (!s) {
				return pid.Path;
			}
		},
		"System.FileName": function (FV, pid, s) {
			if (!s) {
				return pid.Path;
			}
		},
		"System.ItemFolderPathDisplayNarrow": function (FV, pid, s) {
			if (!s) {
				return GetParentFolderName(pid.Path);
			}
		},
		"System.ItemTypeText": function (FV, pid, s) {
			if (!s) {
				const path = pid.Path;
				if (/^ftp:/i.test(path)) {
					return GetTextR("@msieftp.dll,-287");
				}
				if (/^\\\\[^\\]+$|^\\\\[^\\]+\\[^\\]+$/i.test(path)) {
					return GetTextR("@utildll.dll,-201");
				}
			}
		}
	}
}

for (let s in Sync.PathColumn.Get) {
	ColumnsReplace(te, s, HDF_LEFT, Sync.PathColumn.Get[s]);
}

AddEvent("Sorting", function (Ctrl, Name) {
	if (!api.ILIsEqual(Ctrl.FolderItem.Alt, ssfRESULTSFOLDER)) {
		return;
	}
	const res = /^(\-?)(.*)$/.exec(Name);
	const s = api.PSGetDisplayName(res[2], 1);
	const fn = Sync.PathColumn.Get[s];
	if (fn) {
		CustomSort(Ctrl, s, res[1],
			function (pid, FV) {
				return pid.ExtendedProperty(s) || Sync.PathColumn.Get[s](FV, pid) || "";
			},
			function (a, b) {
				return api.StrCmpLogical(b[1], a[1]);
			}
		);
		return true;
	}
});
