var Addon_Id = "treeview";
var Default = "ToolBar2Left";

if (window.Addon == 1) {
	Addons.TreeView =
	{
		Exec: function (Ctrl, pt)
		{
			TV = te.Ctrl(CTRL_TV);
			if (TV) {
				TV.Visible = !TV.Visible;
				if (TV.Width == 0 && TV.Visible) {
					TV.Width = 200;
				}
			}
		},

		Popup: function ()
		{
			var TV = te.Ctrl(CTRL_TV);
			if (TV) {
				var n = InputDialog(GetText("Width"), TV.Width);
				if (n) {
					TV.Width = n;
					TV.Align = true;
				}
			}
		}
	};

	AddEvent("ChangeView", function (Ctrl)
	{
		if (Ctrl.FolderItem) {
			var TV = Ctrl.TreeView;
			if (TV) {
				if (!api.ILIsEqual(Ctrl.FolderItem, TV.SelectedItem)) {
					TV.Expand(Ctrl.FolderItem, 1);
				}
			}
		}
	});
	var h = GetAddonOption(Addon_Id, "IconSize") || window.IconSize || 24;
	var s = GetAddonOption(Addon_Id, "Icon") || (h <= 16 ? "bitmap:ieframe.dll,216,16,43" : "bitmap:ieframe.dll,214,24,43");
	s = 'src="' + s.replace(/"/g, "") + '" width="' + h + 'px" height="' + h + 'px"';
	s = '<span id="TreeViewButton" class="button" onclick="Addons.TreeView.Exec()" oncontextmenu="Addons.TreeView.Popup(); return false" onmouseover="MouseOver(this)" onmouseout="MouseOut()"><img title="Tree" ' + s + '></span>';
	SetAddon(Addon_Id, Default, s);

	SetGestureExec("Tree", "1", function ()
	{
		var hItem = Ctrl.HitTest(pt, TVHT_ONITEM);
		if (hItem) {
			Ctrl.FolderView.Navigate(Ctrl.SelectedItem, OpenMode);
		}
	}, "Func");

	SetGestureExec("Tree", "1", function ()
	{
		var hItem = Ctrl.HitTest(pt, TVHT_ONITEM);
		if (hItem) {
			Ctrl.FolderView.Navigate(Ctrl.SelectedItem, OpenMode);
		}
	}, "Func", true);

	SetGestureExec("Tree", "3", function ()
	{
		var hItem = Ctrl.HitTest(pt, TVHT_ONITEM);
		if (hItem) {
			Ctrl.FolderView.Navigate(Ctrl.SelectedItem, SBSP_NEWBROWSER);
		}
	}, "Func", true);

	//Tab
	SetKeyExec("Tree", "$f", function (Ctrl, pt)
	{
		var FV = GetFolderView(Ctrl, pt);
		FV.focus();
	}, "Func", true);
	//Enter
	SetKeyExec("Tree", "$1c", function (Ctrl, pt)
	{
		var FV = GetFolderView(Ctrl, pt);
		FV.Navigate(Ctrl.SelectedItem, OpenMode);
	}, "Func", true);

	AddTypeEx("Add-ons", "Tree", Addons.TreeView.Exec);

}
