var Addon_Id = "treeview";
var Default = "ToolBar2Left";

if (window.Addon == 1) { (function () {
	Addons.TreeView =
	{
		Exec: function (Ctrl, pt)
		{
			TV = te.Ctrl(CTRL_TV);
			if (TV) {
				TV.Align = TV.Align ^ 2;
				if (TV.Width == 0 && TV.Align & 2) {
					TV.Width = 200;
				}
			}
		},

		Popup: function ()
		{
			var o = document.getElementById("TreeViewButton");
			var TV = te.Ctrl(CTRL_TV);
			if (TV) {
				var hMenu = api.CreatePopupMenu();
				api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, 1, GetText("Width"));
				if (te.Tab) {
					api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, 3, GetText("Auto"));
					api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, 7, GetText("Left"));
				}
				var pt = api.Memory("POINT");
				api.GetCursorPos(pt);
				var nVerb = api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null, null);
				switch (nVerb) {
					case 1:	//Width
						var n = InputDialog(GetText("Width"), TV.Width);
						if (n) {
							TV.Width = n;
							TV.Align = TV.Align | 2;
						}
						break;
					case 3:	//Auto
					case 7:	//Left
						var cTV = te.Ctrls(CTRL_TV);
						for (i = 0; i < cTV.Count; i++) {
							TV = cTV.Item(i);
							TV.Align = (TV.Align & 2) | (nVerb & ~2);
						}
						break;
				}
				api.DestroyMenu(hMenu);
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

	var s = (IconSize == 16) ? 'src="../image/toolbar/m_1_43.png" bitmap="ieframe.dll,216,16,43"' : 'src="../image/toolbar/m_1_43.png" bitmap="ieframe.dll,214,24,43"';
	s = '<span id="TreeViewButton" class="button" onclick="Addons.TreeView.Exec()" oncontextmenu="Addons.TreeView.Popup(); return false" onmouseover="MouseOver(this)" onmouseout="MouseOut()"><img alt="Tree" ' + s + '></span><span style="width: 1px"> </span>';
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

})();}
