var Addon_Id = "split3";
var Default = "ToolBar1Right";

var item = GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.Split3 =
	{
		Exec: function (nMax, nMode)
		{
			var TC = [te.Ctrl(CTRL_TC)];
			var nTC = (TC[0] && TC[0].Count) ? 1 : 0;
			var Group = nTC ? TC[0].Data.Group : 0;
			var cTC = te.Ctrls(CTRL_TC);
			var freeTC = [];
			for (var i = cTC.length; i-- > 0;) {
				var TC1 = cTC[i];
				if (TC1.Data.Group == 0 || TC1.Data.Group == Group) {
					if (TC1.Count == 0) {
						TC1.Close();
					}
					else if (nTC && TC[0] == TC1) {
						TC1.Visible = true;
					}
					else if (nTC < nMax) {
						TC1.Visible = true;
						TC1.Data.Group = Group;
						TC[nTC++] = TC1;
					}
					else {
						TC1.Visible = false;
						TC1.Data.Group = 0;
						freeTC.push(TC1);
					}
				}
			}
			for (;nTC < nMax; nTC++) {
				var path = HOME_PATH;
				var type = CTRL_SB;
				var viewmode = FVM_DETAILS;
				var flags = FWF_SHOWSELALWAYS | FWF_NOWEBVIEW | FWF_AUTOARRANGE;
				var icon = 0;
				var options = EBO_SHOWFRAMES | EBO_ALWAYSNAVIGATE;
				var viewflags = 0;
				if (TC[0]) {
					var FV = TC[0].Selected;
					if (FV) {
						path = FV.FolderItem;
						type = FV.Type;
						viewmode = FV.CurrentViewMode;
						flags = FV.FolderFlags;
						icon = FV.IconSize;
						options = FV.Options;
						viewflags = FV.ViewFlags;
					}
				}
				TC[nTC] = this.CreateTC(freeTC, 0, 0, 0, 0, te.Data.Tab_Style, te.Data.Tab_Align, te.Data.Tab_TabWidth, te.Data.Tab_TabHeight, Group);
				if (TC[nTC].Count == 0) {
					TC[nTC].Selected.Navigate2(path, SBSP_NEWBROWSER, type, viewmode, flags, options, viewflags, icon, te.Data.Tree_Align, te.Data.Tree_Width, te.Data.Tree_Style, te.Data.Tree_EnumFlags, te.Data.Tree_RootStyle, te.Data.Tree_Root);
					TC[nTC].Visible = true;
				}
			}
			switch (nMode) {
				case 1:
					TC[0].Left = 0;
					TC[0].Top = 0;
					TC[0].Width = "33.33%";
					TC[0].Height = "100%";

					TC[1].Left = "33.33%";
					TC[1].Top = 0;
					TC[1].Width = "33.33%";
					TC[1].Height = "100%";

					TC[2].Left = "66.66%";
					TC[2].Top = 0;
					TC[2].Width = "33.33%";
					TC[2].Height = "100%";
					break;
				case 2:
					TC[0].Left = 0;
					TC[0].Top = 0;
					TC[0].Width = "100%";
					TC[0].Height = "33.33%";

					TC[1].Left = 0;
					TC[1].Top = "33.33%";
					TC[1].Width = "100%";
					TC[1].Height = "33.33%";

					TC[2].Left = 0;
					TC[2].Top = "66.66%";
					TC[2].Width = "100%";
					TC[2].Height = "33.33%";
					break;
			}
			TC[0].Selected.Focus();
		},

		CreateTC: function (freeTC, Left, Top, Width, Height, Style, Align, TabWidth, TabHeight, Group)
		{
			if (freeTC.length) {
				TC = freeTC.shift();
				TC.Left = Left;
				TC.Top = Top;
				TC.Width = Width;
				TC.Height = Height;
				TC.Style = Style;
				TC.Align = Align;
				TC.TabWidth = TabWidth;
				TC.TabHeight = TabHeight;
				TC.Visible = true;
			}
			else {
				var TC = te.CreateCtrl(CTRL_TC, Left, Top, Width, Height, Style, Align, TabWidth, TabHeight);
			}
			TC.Data.Group = Group;
			return TC;
		}
	};

	SetAddon(Addon_Id, Default, '<span id="' + Addon_Id + '"></split>');

	AddEvent("load", function ()
	{
		Addons.Split.SetButtons(Addon_Id, Default, item, 3,
		[
			{ id: "3x1", exec: "3, 1" },
			{ id: "1x3", exec: "3, 2" }
		]);
	});
} else {
	var s = ['<label>View</label><br>'];
	var ar = ["3x1", "1x3"];
	for (var i = 0; i < ar.length; i++) {
		s.push('<label><input type="checkbox" id="!No', ar[i], '" />', ar[i], '</label>&nbsp;');
	}
	SetTabContents(0, "General", s);
}
