Addon_Id = "spacefree";
var item = GetAddonElement(Addon_Id);

if (window.Addon == 1) {
	Addons.SpaceFree = {
		SizeFormat: Number(item.getAttribute("SizeFormat")) || te.SizeFormat,
		Get: function (pid) {
			return pid.ExtendedProperty("{9B174B35-40FF-11D2-A27E-00C04FC30871} 2");
		}
	};

	ColumnsReplace(te, "{9B174B35-40FF-11D2-A27E-00C04FC30871} 2", HDF_RIGHT, function (Ctrl, pid, s)
	{
		var size = Addons.SpaceFree.Get(pid);
		if (size) {
			return api.StrFormatByteSize(size, Addons.SpaceFree.SizeFormat);
		}
	});

	if (WINVER < 0x630) {
		Addons.SpaceFree.Get = function (pid) {
			var oDrive = api.GetDiskFreeSpaceEx(pid.Path) || api.GetDiskFreeSpaceEx(fso.GetParentFolderName(pid.Path));
			if (oDrive) {
				return oDrive.FreeBytesOfAvailable;
			}
		};
	}

	AddEvent("ColumnClick", function (Ctrl, iItem)
	{
		var cColumns = api.CommandLineToArgv(Ctrl.Columns(2));
		var s = cColumns[iItem * 2];
		if (s == "{9B174B35-40FF-11D2-A27E-00C04FC30871} 2") {
			Ctrl.SortColumn = (Ctrl.SortColumn != 'System.FreeSpace') ? 'System.FreeSpace' : '-System.FreeSpace';
			return S_OK;
		}
	});

	AddEvent("Sort", function (Ctrl)
	{
		var res = /^prop:(\-?System\.FreeSpace);$/.exec(Ctrl.SortColumns);
		if (res) {
			setTimeout(function ()
			{
				Ctrl.SortColumn = res[1];
			}, 99);
		}
	});

	AddEvent("Sorting", function (Ctrl, Name)
	{
		if (/-?System\.FreeSpace$/i.test(Name)) {
			CustomSort(Ctrl, 'System.FreeSpace', /^-/.test(Name),
				function (pid, FV)
				{
					return Addons.SpaceFree.Get(pid);
				},
				function (a, b)
				{
					return api.UQuadCmp(b[1], a[1]);
				}
			);
			return true;
		}
	});
} else {
	var ado = OpenAdodbFromTextFile("addons\\" + Addon_Id + "\\options.html");
	if (ado) {
		SetTabContents(0, "General", ado.ReadText(adReadAll));
		ado.Close();
	}
}