if (window.Addon == 1) {
	Addons.InnerNewFolder =
	{
		Exec: function (Id)
		{
			var FV = GetInnerFV(Id);
			if (FV) {
				FV.Focus();
				CreateNewFolder(FV);
			}
			return false;
		}
	};

	AddEvent("PanelCreated", function (Ctrl)
	{
		var h = GetAddonOption("innernewfolder", "IconSize") || 16;
		var s = GetAddonOption("innernewfolder", "Icon") || (h <= 16 ? "bitmap:ieframe.dll,216,16,31" : "icon:shell32.dll,205,32");
		s = ['<span class="button" onclick="return Addons.InnerNewFolder.Exec($)" oncontextmenu="return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()"><img title="New Folder" src="', s.replace(/"/g, ""), '" width="', h, 'px" height="', h, 'px"></span>'];
		SetAddon(null, "Inner1Left_" + Ctrl.Id, s.join("").replace(/\$/g, Ctrl.Id));
	});
}
