Addon_Id = "sizestatus";
Default = "BottomBar3Right";

if (window.Addon == 1) {
	SetAddon(Addon_Id, Default, '<span id="size_statusbar">&nbsp;</span>');

	Addons.SizeStatus =
	{
		SessionId: 0,
		Folder: GetAddonOption(Addon_Id, "Folder"),
		FileSize: GetAddonOption(Addon_Id, "FileSize"),

		Exec: function (Ctrl)
		{
			var s = "";
			var bYet = false;
			var nSize = 0;
			var FV = GetFolderView(Ctrl);
			if (!FV) {
				return;
			}
			var pid = FV.FolderItem;
			if (!pid) {
				return;
			}
			var nCount = FV.ItemCount(SVGIO_SELECTION);
			var SessionId = api.CRC32(nCount ? ExtractMacro(te, '%Selected%') : fso.BuildPath(pid.Path, FV.FilterView));
			if (SessionId == Addons.SizeStatus.SessionId) {
				return;
			}
			if (nCount || Addons.SizeStatus.FileSize) {
				var Selected = nCount ? FV.SelectedItems() : FV.Items();
				for (var i = Selected.Count; i-- > 0;) {
					var Item = Selected.Item(i);
					if (IsFolderEx(Item)) {
						if (Addons.SizeStatus.Folder) {
							var n = FV.TotalFileSize[api.GetDisplayNameOf(Item, SHGDN_FORPARSING | SHGDN_ORIGINAL)];
							if (n === undefined) {
								FV.Notify(0, Item, null, 1);
								bYet = true;
							} else if (n === "") {
								bYet = true;
							} else {
								nSize = api.UQuadAdd(nSize, n);
							}
						} else {
							bYet = true;
							Addons.SizeStatus.SessionId = SessionId;
						}
						continue;
					}
					nSize = api.UQuadAdd(nSize, Item.ExtendedProperty("Size"));
				}
				if (!bYet) {
					Addons.SizeStatus.SessionId = SessionId;
				}
			} else {
				bYet = true;
				Addons.SizeStatus.SessionId = SessionId;
			}
			if (bYet && (Addons.SizeStatus.Folder || !api.UQuadCmp(nSize, 0))) {
				s = " ";
				if (!FV.FolderItem.Unavailable) {
					var oDrive = api.GetDiskFreeSpaceEx(pid.Path);
					if (oDrive) {
						s = api.PSGetDisplayName("{9B174B35-40FF-11D2-A27E-00C04FC30871} 2") + " " + api.StrFormatByteSize(oDrive.FreeBytesOfAvailable);
					}
				}
			}
			document.getElementById("size_statusbar").innerHTML = "&nbsp;" + (s || api.StrFormatByteSize(nSize));
		}
	}

	AddEvent("StatusText", Addons.SizeStatus.Exec);
	AddEvent("Load", Addons.SizeStatus.Exec);
} else {
	var ado = OpenAdodbFromTextFile("addons\\" + Addon_Id + "\\options.html");
	if (ado) {
		SetTabContents(0, "General", ado.ReadText(adReadAll));
		ado.Close();
	}
}

