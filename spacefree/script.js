const Addon_Id = "spacefree";
if (window.Addon == 1) {
	Addons.SpaceFree = {
		tid: {},

		Clear: function (Id) {
			if (Addons.SpaceFree.tid[Id]) {
				clearTimeout(Sync.SpaceFree.tid[Id]);
				delete Sync.SpaceFree.tid[Id];
			}
		}
	};

	AddEvent("Sort", async function (Ctrl) {
		const Id = await Ctrl.Id;
		Addons.SpaceFree.Clear(Id);
		const SortColumn = await Ctrl.GetSortColumn(1);
		if (/^\-?System\.FreeSpace$/.exec(SortColumn)) {
			Sync.SpaceFree.tid[Id] = setTimeout(function (SortColumn) {
				Sync.SpaceFree.Sort(Ctrl, SortColumn);
			}, 99, SortColumn);
		}
	});

	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	SetTabContents(0, "General", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));
}
