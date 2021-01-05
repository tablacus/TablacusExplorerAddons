const Addon_Id = "spacefree";
const item = GetAddonElement(Addon_Id);

Sync.SpaceFree = {
	SizeFormat: GetNum(item.getAttribute("SizeFormat")) || te.SizeFormat,

	Get: function (pid) {
		return pid.ExtendedProperty("{9B174B35-40FF-11D2-A27E-00C04FC30871} 2");
	},

	Sort: function (Ctrl, Name) {
		InvokeUI("Addons.SpaceFree.Clear", Ctrl.Id);
		if (/^\-?System\.FreeSpace$/i.test(Name)) {
			CustomSort(Ctrl, 'System.FreeSpace', /^\-/.test(Name),
				function (pid, FV) {
					return Sync.SpaceFree.Get(pid);
				},
				function (a, b) {
					return api.UQuadCmp(b[1], a[1]);
				}
			);
			return true;
		}
	}
};

ColumnsReplace(te, "{9B174B35-40FF-11D2-A27E-00C04FC30871} 2", HDF_RIGHT, function (Ctrl, pid, s) {
	const size = Sync.SpaceFree.Get(pid);
	if (size) {
		return api.StrFormatByteSize(size, Sync.SpaceFree.SizeFormat);
	}
});

if (WINVER < 0x630) {
	Sync.SpaceFree.Get = function (pid) {
		const oDrive = api.GetDiskFreeSpaceEx(pid.Path) || api.GetDiskFreeSpaceEx(fso.GetParentFolderName(pid.Path));
		if (oDrive) {
			return oDrive.FreeBytesOfAvailable;
		}
	};
}

AddEvent("ColumnClick", function (Ctrl, iItem) {
	const cColumns = api.CommandLineToArgv(Ctrl.Columns(2));
	const s = cColumns[iItem * 2];
	if (s == "{9B174B35-40FF-11D2-A27E-00C04FC30871} 2") {
		Ctrl.SortColumn = (Ctrl.SortColumn != 'System.FreeSpace') ? 'System.FreeSpace' : '-System.FreeSpace';
		return S_OK;
	}
});

AddEvent("Sorting", Sync.SpaceFree.Sort);
