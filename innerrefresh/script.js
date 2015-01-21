if (window.Addon == 1) {
	Addons.InnerRefresh =
	{
		Exec: function (Id)
		{
			var FV = GetInnerFV(Id);
			if (FV) {
				FV.Focus();
				FV.Refresh();
			}
			return false;
		}
	};

	AddEvent("PanelCreated", function (Ctrl)
	{
		var h = GetAddonOption("innerrefresh", "IconSize") || 16;
		var s = GetAddonOption("innerrefresh", "Icon") || (h <= 16 ? "bitmap:ieframe.dll,206,16,3" : "bitmap:ieframe.dll,204,24,3");
		s = ['<span class="button" onclick="return Addons.InnerRefresh.Exec($)" oncontextmenu="return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()"><img title="Refresh" src="', s.replace(/"/g, ""), '" width="', h, 'px" height="', h, 'px"></span>'];
		SetAddon(null, "Inner1Left_" + Ctrl.Id, s.join("").replace(/\$/g, Ctrl.Id));
	});
}
