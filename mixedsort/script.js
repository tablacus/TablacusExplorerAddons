const Addon_Id = "mixedsort";
const Default = "ToolBar2Left";
if (window.Addon == 1) {
	Addons.MixedSort = {
		tid: {},

		ClearTimer: function (Id) {
			if (Addons.MixedSort.tid[Id]) {
				clearTimeout(Addons.MixedSort.tid[Id]);
				delete Addons.MixedSort.tid[Id];
			}
		}
	};

	AddEvent("Layout", async function () {
		const item = await GetAddonElement(Addon_Id);
		SetAddon(Addon_Id, Default, ['<span class="button" onclick="SyncExec(Sync.MixedSort.Exec, this, 9);" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({
			title: item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name,
			src: item.getAttribute("Icon") || "icon:general,24"
		}, GetIconSizeEx(item)), '</span>']);
	});

	AddEvent("Sort", async function (Ctrl) {
		const Id = await Ctrl.Id;
		Addons.MixedSort.ClearTimer(Id);
		const col = await Ctrl.GetSortColumn(1);
		if (/^\-?Tablacus\.Name$|^\-?Tablacus\.Write$/i.test(col)) {
			Addons.MixedSort.tid[Id] = setTimeout(function (Ctrl, col) {
				Sync.MixedSort.Sort(Ctrl, col);
			}, 99, Ctrl, col);
		}
	});

	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	EnableInner();
}
