var Addon_Id = "simpletoolbar";
var Default = "ToolBar2Left";

if (window.Addon == 1) { (function () {
	var a =
	{
		Back:
		[
			"Navigate(null, SBSP_NAVIGATEBACK | SBSP_SAMEBROWSER);",
			's_1_0.png" bitmap="ieframe.dll,216,16,0', 
			'm_1_0.png" bitmap="ieframe.dll,214,24,0'
		],
		Forward:
		[
			"Navigate(null, SBSP_NAVIGATEFORWARD | SBSP_SAMEBROWSER);",
			's_1_1.png" bitmap="ieframe.dll,216,16,1',
			'm_1_1.png" bitmap="ieframe.dll,214,24,1'
		],
		Up:
		[
			"Navigate(null, SBSP_PARENT | OpenMode);",
			's_1_28.png" bitmap="ieframe.dll,216,16,28',
			'm_1_28.png" bitmap="ieframe.dll,214,24,28'
		],
		"New Tab":
		[
			"CreateTab();",
			's_1_12.png" bitmap="ieframe.dll,216,16,12',
			'm_1_12.png" bitmap="ieframe.dll,214,24,12'
		],
		Refresh:
		[
			"Refresh();",
			's_2_3.png" bitmap="ieframe.dll,206,16,3',
			'm_2_3.png" bitmap="ieframe.dll,204,24,3',
		]
	};
	var s = [];
	var img = (GetAddonOption(Addon_Id, "IconSize") || window.IconSize) == 16 ? 1 : 2;
	for (var i in a) {
		s.push('<span class="button" onmouseover="MouseOver(this)" onmouseout="MouseOut()" onclick="');
		s.push(a[i][0]);
		s.push('" oncontextmenu="return false;"><img title="');
		s.push(i);
		s.push('" src="../image/toolbar/');
		s.push(a[i][img]);
		s.push('"></span>');
	}
	SetAddon(Addon_Id, Default, s);
})();}
