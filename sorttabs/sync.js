const item = GetAddonElement("sorttabs");

Sync.SortTabs = {
	fn: [],
	nSort: GetNum(item.getAttribute("Sort")),

	Exec: function (Ctrl) {
		const FV = GetFolderView(Ctrl);
		if (FV) {
			const TC = FV.Parent;
			if (TC) {
				let ar = [];
				for (let i = TC.Count; --i >= 0;) {
					ar[i] = i;
				}
				ar.sort(function (a, b) {
					const fn = Sync.SortTabs.fn;
					for (let i = 0; i < fn.length; ++i) {
						const d = fn[i][0](fn[i][1](TC[a]), fn[i][1](TC[b]));
						if (d) {
							return d;
						}
					}
				});
				TC.SetOrder(ar);
			}
		}
	},

	Cmp: [
		function (a, b) {
			return api.CompareIDs(0, a, b);
		},
		function (a, b) {
			return api.StrCmpLogical(GetTabName(a), GetTabName(b)) || api.CompareIDs(0, a, b);
		},
	],

	Get: function (FV) {
		return FV;
	}
}

Sync.SortTabs.fn.push([Sync.SortTabs.Cmp[Sync.SortTabs.nSort], Sync.SortTabs.Get]);

AddEvent("Load", function () {
	if (Sync.LockedTabsTop && Sync.LockedTabsTop.fn) {
		Sync.LockedTabsTop.fn.push([Sync.SortTabs.Cmp[Sync.SortTabs.nSort], Sync.SortTabs.Get]);
	}
});

AddTypeEx("Add-ons", "Sort tabs", Sync.SortTabs.Exec);

