Addon_Id = "sizestatus";
Default = "BottomBar3Right";

Addons.SizeStatus = {
	Cache: null
};

if (window.Addon == 1) {
	SetAddon(Addon_Id, Default, '<span id="size_statusbar">&nbsp;</span>');

	AddEvent("StatusText", function (Ctrl, Text, iPart)
	{
		var s = "";
		try {
			var nSize = 0;
			var FV = GetFolderView(Ctrl);
			var path = api.GetDisplayNameOf(FV, SHGDN_FORPARSING | SHGDN_FORADDRESSBAR);
			var nCount = FV.ItemCount(SVGIO_SELECTION);
			if (nCount) {
				var Selected = FV.SelectedItems();
				var Cache = nCount > 1 ? path + ":" + nCount : api.GetDisplayNameOf(Selected.Item(0), SHGDN_FORPARSING | SHGDN_FORADDRESSBAR);
				if (Cache == Addons.SizeStatus.Cahce) {
					return;
				}
				Addons.SizeStatus.Cahce = Cache;
				for (var i = nCount; i--;) {
					nSize = api.UQuadAdd(nSize, Selected.Item(i).ExtendedProperty("Size"));
				}
				s = api.StrFormatByteSize(nSize);
			}
			if (api.UQuadCmp(nSize, 0) == 0 && !FV.FolderItem.Unavailable) {
				var strDrive = fso.GetDriveName(path);
				if (strDrive == Addons.SizeStatus.Cahce) {
					return;
				}
				Addons.SizeStatus.Cahce = strDrive;
				var oDrive = fso.GetDrive(strDrive);
				if (oDrive.IsReady) {
					s = strDrive + " " + api.StrFormatByteSize(oDrive.AvailableSpace);
				}
			}
		}
		catch (e) {
		}
		document.getElementById("size_statusbar").innerHTML = "&nbsp;" + s;
		return S_OK;
	});
}
