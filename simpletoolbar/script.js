var Addon_Id = "simpletoolbar";
var Default = "ToolBar2Left";

if (window.Addon == 1) {
	var a =
	{
		Back:
		[
			"Navigate(null, SBSP_NAVIGATEBACK | SBSP_SAMEBROWSER);",
			'bitmap:ieframe.dll,216,16,0', 
			'bitmap:ieframe.dll,214,24,0'
		],
		Forward:
		[
			"Navigate(null, SBSP_NAVIGATEFORWARD | SBSP_SAMEBROWSER);",
			'bitmap:ieframe.dll,216,16,1',
			'bitmap:ieframe.dll,214,24,1'
		],
		Up:
		[
			"Navigate(null, SBSP_PARENT | OpenMode);",
			'bitmap:ieframe.dll,216,16,28',
			'bitmap:ieframe.dll,214,24,28'
		],
		"New Tab":
		[
			"CreateTab();",
			'bitmap:ieframe.dll,216,16,12',
			'bitmap:ieframe.dll,214,24,12'
		],
		Refresh:
		[
			"Refresh();",
			'bitmap:ieframe.dll,206,16,3',
			'bitmap:ieframe.dll,204,24,3',
		]
	};
	var s = [];
	var img = (GetAddonOption(Addon_Id, "IconSize") || window.IconSize) == 16 ? 1 : 2;
	for (var i in a) {
		s.push('<span class="button" onmouseover="MouseOver(this)" onmouseout="MouseOut()" onclick="', a[i][0], '" oncontextmenu="return false;"><img title="', i, '" src="', a[i][img], '"></span>');
	}
	SetAddon(Addon_Id, Default, s);
}
