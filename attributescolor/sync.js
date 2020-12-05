const Addon_Id = "attributescolor";
const item = GetAddonElement(Addon_Id);

Sync.AttributesColor = {
	Color: {},
	attrs: ["root", FILE_ATTRIBUTE_REPARSE_POINT, FILE_ATTRIBUTE_ENCRYPTED, FILE_ATTRIBUTE_SYSTEM, FILE_ATTRIBUTE_HIDDEN, FILE_ATTRIBUTE_READONLY, FILE_ATTRIBUTE_COMPRESSED, FILE_ATTRIBUTE_DIRECTORY]
};

AddEvent("ItemPrePaint", function (Ctrl, pid, nmcd, vcd, plRes) {
	if (pid) {
		if (api.PathIsRoot(pid.Path)) {
			const i = Sync.AttributesColor.Color["root"];
			if (isFinite(i)) {
				vcd.clrText = i;
				return;
			}
		}
		const wfd = api.Memory("WIN32_FIND_DATA");
		api.SHGetDataFromIDList(pid, SHGDFIL_FINDDATA, wfd, wfd.Size);
		for (let i in Sync.AttributesColor.attrs) {
			const j = Sync.AttributesColor.attrs[i];
			if (j & wfd.dwFileAttributes) {
				vcd.clrText = Sync.AttributesColor.Color[j];
				break;
			}
		}
	}
});

for (let i = Sync.AttributesColor.attrs.length; i--;) {
	const j = Sync.AttributesColor.attrs[i];
	const s = GetWinColor(item.getAttribute("c" + j));
	if (isFinite(s) && s != null) {
		Sync.AttributesColor.Color[j] = s;
	} else {
		delete Sync.AttributesColor.attrs[i];
	}
}
