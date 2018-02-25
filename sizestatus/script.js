Addon_Id = "sizestatus";
Default = "BottomBar3Right";

if (window.Addon == 1) {
	SetAddon(Addon_Id, Default, '<span id="size_statusbar">&nbsp;</span>');

	Addons.SizeStatus =
	{
		SessionId: 0,
		Folder: GetAddonOption(Addon_Id, "Folder"),

		Show: function (nSize, SessionId)
		{
			if (SessionId == Addons.SizeStatus.SessionId) {
				document.getElementById("size_statusbar").innerHTML = '&nbsp' + api.StrFormatByteSize(nSize);
			}
		},

		Set: function (FV, cFileName, SessionId, nSize)
		{
			if (SessionId == Addons.SizeStatus.SessionId) {
				FV.TotalFileSize[cFileName] = nSize;
			}
		}
	}

	AddEvent("StatusText", function (Ctrl, Text, iPart)
	{
		var s = "";
		try {
			var nSize = 0;
			var FV = GetFolderView(Ctrl);
			var path = api.GetDisplayNameOf(FV, SHGDN_FORPARSING | SHGDN_FORADDRESSBAR);
			var nCount = FV.ItemCount(SVGIO_SELECTION);
			var strDrive = fso.GetDriveName(path);
			var SessionId = api.CRC32(nCount ? ExtractMacro(te, '%Selected%') : strDrive);
			if (SessionId == Addons.SizeStatus.SessionId) {
				return;
			}
			Addons.SizeStatus.SessionId = SessionId;
			if (nCount) {
				var Selected = FV.SelectedItems();
				var ar = [];
				for (var i = nCount; i--;) {
					var Item = Selected.Item(i);
					if (Addons.SizeStatus.Folder && IsFolderEx(Item)) {
						var wfd = api.Memory("WIN32_FIND_DATA");
						var hr = api.SHGetDataFromIDList(Item, SHGDFIL_FINDDATA, wfd, wfd.Size);
						var nTFS = FV.TotalFileSize[wfd.cFileName];
						if (api.UQuadCmp(nTFS, 0)) {
							nSize = api.UQuadAdd(nSize, nTFS);
						} else if (/^[A-Z]:\\|^\\\\[A-Z]/i.test(Item.Path)) {
							if (!strDrive) {
								strDrive = fso.GetDriveName(Item.path);
							}
							ar.push(Item.Path);
						}
					}
					nSize = api.UQuadAdd(nSize, Item.ExtendedProperty("Size"));
				}
				if (ar.length) {
					OpenNewProcess("addons\\sizestatus\\worker.js",
					{
						FV: FV,
						list: ar.join("\0"),
						SizeStatus: Addons.SizeStatus,
						SessionId: SessionId,
						nSize: nSize,
					});
					nSize = 0;
				}
			}
			if (api.UQuadCmp(nSize, 0) == 0 && !FV.FolderItem.Unavailable) {
				var oDrive = fso.GetDrive(strDrive);
				if (oDrive.IsReady) {
					s = strDrive + " " + api.StrFormatByteSize(oDrive.AvailableSpace);
				}
			}
			if (!s && api.UQuadCmp(nSize, 0)) {
				s = api.StrFormatByteSize(nSize);
			}
		} catch (e) {}
		document.getElementById("size_statusbar").innerHTML = "&nbsp;" + s;
		return S_OK;
	});
} else {
	SetTabContents(0, "General", '<input type="checkbox" id="Folder" /><label for="Folder">Folder</label>');
}

