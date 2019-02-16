var Addon_Id = "listwidth";

if (window.Addon == 1) {
	Addons.ListWidth = {
		Width: GetAddonOptionEx("listwidth", "Width"),

		Exec: function (Ctrl)
		{
			if (Addons.ListWidth.Width > 29 || Addons.ListWidth.Width < 0) {
				var hList = Ctrl.hwndList;
				if (hList && api.SendMessage(hList, LVM_GETVIEW, 0, 0) == 3) {
					api.SendMessage(hList, LVM_SETCOLUMNWIDTH, 0, Addons.ListWidth.Width);
				}
			}
		},

		Set: function (Ctrl, n)
		{
			Addons.ListWidth.Width = n;
			Addons.ListWidth.Exec(GetFolderView(Ctrl));
		}
	}

	AddEvent("ListViewCreated", Addons.ListWidth.Exec);
	AddEvent("NavigateComplete", Addons.ListWidth.Exec);
	AddEvent("ViewModeChanged", Addons.ListWidth.Exec);

	var cFV = te.Ctrls(CTRL_FV);
	for (var i in cFV) {
		Addons.ListWidth.Exec(cFV[i]);
	}
} else {
	SetTabContents(0, "", '<label>Width</label><br /><input type="text" id="Width" style="width: 100%" />');
}
