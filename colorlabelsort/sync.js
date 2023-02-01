const Addon_Id = "colorlabelsort";
const item = GetAddonElement(Addon_Id);

Sync.ColorLabelSort = {
	sName: item.getAttribute("MenuName") || GetAddonInfo("colorlabels").Name,
	nPos: GetNum(item.getAttribute("MenuPos")),

	Exec: function (Ctrl, pt) {
		const FV = GetFolderView(Ctrl, pt);
		if (FV && Sync.ColorLabels) {
			FV.Focus();
			FV.SortColumn = "Tablacus.ColorLabel";
			return S_OK;
		}
	},

	Sort: function (Ctrl, Name) {
		if (/\-?Tablacus\.ColorLabel$/i.test(Name)) {
			CustomSort(Ctrl, Sync.ColorLabelSort.sName, /^\-/.test(Name),
				function (pid, FV) {
					return Sync.ColorLabels.GetWebColor(pid);
				},
				function (a, b) {
					return api.StrCmpI(a[1], b[1]);
				}
			);
			return true;
		}
	}
};

AddEvent("Sorting", Sync.ColorLabelSort.Sort);

//Menu
if (item.getAttribute("MenuExec")) {
	AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos) {
		api.InsertMenu(hMenu, Sync.ColorLabelSort.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Sync.ColorLabelSort.sName);
		ExtraMenuCommand[nPos] = Sync.ColorLabelSort.Exec;
		return nPos;
	});
}
//Key
if (item.getAttribute("KeyExec")) {
	SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Sync.ColorLabelSort.Exec, "Func");
}
//Mouse
if (item.getAttribute("MouseExec")) {
	SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Sync.ColorLabelSort.Exec, "Func");
}
//Type
AddTypeEx("Add-ons", "Color label sort", Sync.ColorLabelSort.Exec);
