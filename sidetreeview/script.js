var Addon_Id = "sidetreeview";

if (window.Addon == 1) {
	Addons.SideTreeView =
	{
		Align: GetAddonOptionEx(Addon_Id, "Align") ? "Right" : "Left",
		Depth: GetAddonOptionEx(Addon_Id, "Depth"),
		Height: GetAddonOption(Addon_Id, "Height") || '100%',

		Init: function ()
		{
			if (!te.Data["Conf_" + this.Align + "BarWidth"]) {
				te.Data["Conf_" + this.Align + "BarWidth"] = 178;
			}
			SetAddon(Addon_Id, this.Align + "Bar2", ['<div id="sidetreeview" style="width: 100%; height: ', EncodeSC(Addons.SideTreeView.Height), '"></div>']);
			if (te.Ctrls(CTRL_FV).Count) {
				this.Create();
			}
		},

		Create: function ()
		{
			this.TV = te.CreateCtrl(CTRL_TV);
			this.TV.Visible = true;

			AddEvent("ChangeView", Addons.SideTreeView.Expand);

			AddEvent("Resize", function ()
			{
				var o = document.getElementById("sidetreeview");
				var pt = GetPos(o);
				api.MoveWindow(Addons.SideTreeView.TV.hwnd, pt.x, pt.y, o.offsetWidth, o.offsetHeight, true);
				api.RedrawWindow(Addons.SideTreeView.TV.hwnd, null, 0, RDW_INVALIDATE | RDW_ERASE | RDW_FRAME | RDW_ALLCHILDREN);
			});

			AddEvent("Finalize", function ()
			{
				Addons.SideTreeView.TV.Close();
			});
		},

		Expand: function (Ctrl)
		{
			if (Ctrl.FolderItem && !IsSearchPath(Ctrl.FolderItem)) {
				var TV = Addons.SideTreeView.TV;
				if (TV) {
					if (Addons.SideTreeView.tid) {
						clearTimeout(Addons.SideTreeView.tid);
						delete Addons.SideTreeView.tid;
					}
					TV.Expand(Ctrl.FolderItem, Addons.SideTreeView.Depth);
					Addons.SideTreeView.tid = setTimeout(function ()
					{
						delete Addons.SideTreeView.tid;
						TV.Expand(Ctrl.FolderItem, 0);
					}, 500);
				}
			}
		}
	};

	AddEvent("Create", function (Ctrl)
	{
		if (Ctrl.Type == CTRL_TE) {
			Addons.SideTreeView.Create();
		}
	});
	Addons.SideTreeView.Init();
} else {
	SetTabContents(0, "General", '<div><label>Align</label></div><input type="hidden" name="Align" /><input type="radio" name="_Align" id="Align=0" onclick="SetRadio(this)" /><label for="Align=0">Left</label><input type="radio" name="_Align" id="Align=1" onclick="SetRadio(this)" /><label for="Align=1">Right</label><input type="checkbox" id="Depth" value="1" /><label for="Depth">Expanded</label><br><br><label>Height</label><br><input type="text" name="Height" size="9" />');
}
