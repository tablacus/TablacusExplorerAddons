const Addon_Id = "mixedsort";
const Default = "ToolBar2Left";

if (window.Addon == 1) {
	const item = await GetAddonElement(Addon_Id);

	Addons.MixedSort = {
		tid: {},

		Exec: async function (el) {
			const FV = await GetFolderViewEx(el);
			const pt = await GetPosEx(el, 9);
			Sync.MixedSort.Exec(FV, pt);
		},

		ClearTimer: function (Id) {
			if (Addons.MixedSort.tid[Id]) {
				clearTimeout(Addons.MixedSort.tid[Id]);
				delete Addons.MixedSort.tid[Id];
			}
		}
	};

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

	const h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	const src = item.getAttribute("Icon") || (h <= 16 ? "bitmap:ieframe.dll,216,16,24" : "bitmap:ieframe.dll,214,24,24");
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="return Addons.MixedSort.Exec(this);" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({ title: item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name, src: src }, h), '</span>']);

	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	EnableInner();
}
