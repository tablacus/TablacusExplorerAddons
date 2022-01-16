const Addon_Id = "copyfoldersettings";
const item = GetAddonElement(Addon_Id);

Sync.CopyFolderSettings = {
	sName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
	nPos: GetNum(item.getAttribute("MenuPos")),
	Format: GetNum(item.getAttribute("Format")),

	Exec: function (Ctrl, pt) {
		const FV = te.Ctrl(CTRL_FV);
		const s = ["FV.SetViewMode(", FV.CurrentViewMode, ",", FV.IconSize, ");\n"];
		s.push("FV.Columns='", FV.GetColumns(Sync.CopyFolderSettings.Format), "';\n");
		s.push("FV.GroupBy='", FV.GroupBy, "';\n");
		if ((FV.SortColumns || "").split(/;/).length > 2 && FV.SortColumn != "System.Null") {
			s.push("FV.SortColumns='", FV.SortColumns, "';\n");
		} else {
			s.push("FV.SortColumn='", FV.GetSortColumn(Sync.CopyFolderSettings.Format), "';\n");
		}
		clipboardData.setData("text", s.join(""));
	}
}
//Menu
if (item.getAttribute("MenuExec")) {
	AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos, Selected, item) {
		api.InsertMenu(hMenu, Sync.CopyFolderSettings.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Sync.CopyFolderSettings.sName);
		ExtraMenuCommand[nPos] = Sync.CopyFolderSettings.Exec;
		return nPos;
	});
}
//Key
if (item.getAttribute("KeyExec")) {
	SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Sync.CopyFolderSettings.Exec, "Func");
}
//Mouse
if (item.getAttribute("MouseExec")) {
	SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Sync.CopyFolderSettings.Exec, "Func");
}

AddTypeEx("Add-ons", "Copy folder settings", Sync.CopyFolderSettings.Exec);
