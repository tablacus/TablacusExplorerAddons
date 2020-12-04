const Addon_Id = "extensioncolor";

Sync.ExtensionColor = {
	Color: {}
};
try {
	const ado = OpenAdodbFromTextFile(BuildPath(te.Data.DataFolder, "config\\extensioncolor.tsv"));
	while (!ado.EOS) {
		const ar = ado.ReadText(adReadLine).split("\t");
		if (ar[0]) {
			const a2 = ar[0].toLowerCase().split(/\s*;\s*/);
			for (let i in a2) {
				const s = a2[i].replace(/[\.\*]/, "");
				if (s) {
					Sync.ExtensionColor.Color[s] = GetWinColor(ar[1]);
				}
			}
		}
	}
	ado.Close();
} catch (e) { }

AddEvent("ItemPrePaint", function (Ctrl, pid, nmcd, vcd, plRes) {
	if (pid) {
		const c = Sync.ExtensionColor.Color[fso.GetExtensionName(api.GetDisplayNameOf(pid, SHGDN_FORPARSING)).toLowerCase()];
		if (isFinite(c)) {
			const wfd = api.Memory("WIN32_FIND_DATA");
			const hr = api.SHGetDataFromIDList(pid, SHGDFIL_FINDDATA, wfd, wfd.Size);
			if (hr < 0 || !(wfd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY)) {
				vcd.clrText = c;
				return S_OK;
			}
		}
	}
});
