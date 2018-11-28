Addon_Id = "sizestatus";
Default = "BottomBar3Right";

if (window.Addon == 1) {
	SetAddon(Addon_Id, Default, '<span id="size_statusbar">&nbsp;</span>');

	Addons.SizeStatus =
	{
		SessionId: 0,
		Folder: GetAddonOption(Addon_Id, "Folder"),

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
			var SessionId = api.CRC32(nCount ? ExtractMacro(te, '%Selected%') : pid.Path);
			if (SessionId == Addons.SizeStatus.SessionId) {
				return;
			}
			if (nCount) {
				var Selected = FV.SelectedItems();
				for (var i = Selected.Count; i-- > 0;) {
					var Item = Selected.Item(i);
					if (Addons.SizeStatus.Folder && IsFolderEx(Item)) {
						var n = FV.TotalFileSize[api.GetDisplayNameOf(Item, SHGDN_FORPARSING | SHGDN_ORIGINAL)];
						if (n === undefined) {
							FV.Notify(0, Item, null, 1);
							bYet = true;
						} else if (n === "") {
							bYet = true;
						} else {
							nSize = api.UQuadAdd(nSize, n);
						}
						continue;
					}
					nSize = api.UQuadAdd(nSize, Item.ExtendedProperty("Size"));
				}
			}
			if (bYet) {
				nSize = 0;
			} else {
				Addons.SizeStatus.SessionId = SessionId;
			}
			if (api.UQuadCmp(nSize, 0) == 0 && !FV.FolderItem.Unavailable) {
				var oDrive = api.GetDiskFreeSpaceEx(pid.Path);
				if (oDrive) {
					s = api.PSGetDisplayName("{9B174B35-40FF-11D2-A27E-00C04FC30871} 2") + " " + api.StrFormatByteSize(oDrive.FreeBytesOfAvailable);
				}
			}
			if (!s && api.UQuadCmp(nSize, 0)) {
				s = api.StrFormatByteSize(nSize);
			}
			document.getElementById("size_statusbar").innerHTML = "&nbsp;" + s;
		},

		Show: function (nSize, SessionId)
		{
			if (SessionId == Addons.SizeStatus.SessionId) {
				document.getElementById("size_statusbar").innerHTML = '&nbsp' + api.StrFormatByteSize(nSize);
			}
		}
	}

	AddEvent("StatusText", Addons.SizeStatus.Exec);
} else {
	SetTabContents(0, "General", '<input type="checkbox" id="Folder" /><label for="Folder">Folder</label>');
}

