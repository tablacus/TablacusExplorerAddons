var Addon_Id = "split";
var Default = "ToolBar1Right";

var item = GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.Split =
	{
		Exec: function (nMax, nMode)
		{
			var TC = [te.Ctrl(CTRL_TC)];
			Addons.Split.Exec2(nMax, TC);
			switch (nMode) {
				case 1:
					TC[0].Left = 0;
					TC[0].Top = 0;
					TC[0].Width = "100%";
					TC[0].Height = "100%";
					break;
				case 2:
					TC[0].Left = 0;
					TC[0].Top = 0;
					TC[0].Width = "100%";
					TC[0].Height = "50%";
					TC[1].Left = 0;
					TC[1].Top = "50%";
					TC[1].Width = "100%";
					TC[1].Height = "50%";
					break;
				case 3:
					TC[0].Left = 0;
					TC[0].Top = 0;
					TC[0].Width = "50%";
					TC[0].Height = "100%";
					TC[1].Left = "50%";
					TC[1].Top = 0;
					TC[1].Width = "50%";
					TC[1].Height = "100%";
					break;
				case 4:
					TC[0].Left = 0;
					TC[0].Top = 0;
					TC[0].Width = "50%";
					TC[0].Height = "50%";
					TC[1].Left = "50%";
					TC[1].Top = 0;
					TC[1].Width = "50%";
					TC[1].Height = "50%";
					TC[2].Left = 0;
					TC[2].Top = "50%";
					TC[2].Width = "50%";
					TC[2].Height = "50%";
					TC[3].Left = "50%";
					TC[3].Top = "50%";
					TC[3].Width = "50%";
					TC[3].Height = "50%";
					break;
			}
			TC[0].Selected.Focus();
		},

		Exec2: function (nMax, TC)
		{
			var nTC = (TC[0] && TC[0].Count) ? 1 : 0;
			var Group = nTC ? TC[0].Data.Group : 0;
			var cTC = te.Ctrls(CTRL_TC);
			var freeTC = [];
			for (var i = cTC.length; i-- > 0;) {
				var TC1 = cTC[i];
				if (TC1.Data.Group == 0 || TC1.Data.Group == Group) {
					if (TC1.Count == 0) {
						TC1.Close();
					} else if (nTC && TC[0] == TC1) {
						TC1.Visible = true;
					} else if (nTC < nMax) {
						TC1.Visible = true;
						TC1.Data.Group = Group;
						TC[nTC++] = TC1;
					} else {
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
				TC[nTC] = Addons.Split.CreateTC(freeTC, 0, 0, 0, 0, te.Data.Tab_Style, te.Data.Tab_Align, te.Data.Tab_TabWidth, te.Data.Tab_TabHeight, Group);
				if (TC[nTC].Count == 0) {
					TC[nTC].Selected.Navigate2(path, SBSP_NEWBROWSER, type, viewmode, flags, options, viewflags, icon, te.Data.Tree_Align, te.Data.Tree_Width, te.Data.Tree_Style, te.Data.Tree_EnumFlags, te.Data.Tree_RootStyle, te.Data.Tree_Root);
					TC[nTC].Visible = true;
				}
			}
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
			} else {
				var TC = te.CreateCtrl(CTRL_TC, Left, Top, Width, Height, Style, Align, TabWidth, TabHeight);
			}
			TC.Data.Group = Group;
			return TC;
		},

		SetButtons: function (Addon_Id, Default, item, n, ar)
		{
			var s = [];
			for (var i = 0; i < ar.length; i++) {
				if (!item.getAttribute("No" + ar[i].id)) {
					s.push('<span class="button" onclick="Addons.Split', n, '.Exec(', ar[i].exec, ')" onmouseover="MouseOver(this)" onmouseout="MouseOut()"><img title="', ar[i].id, '" src="../addons/split', n, '/', ar[i].img || ar[i].id, '.png" style="width: 12pt"></span>');
				}
			}
			document.getElementById(Addon_Id).innerHTML = s.join("");
		}
	};

	SetAddon(Addon_Id, Default, '<span id="' + Addon_Id + '"></span>');

	AddEvent("load", function ()
	{
		Addons.Split.SetButtons(Addon_Id, Default, item, "",
		[
			{ id: "1x1", exec: "1, 1", img: "1tab" },
			{ id: "1x2", exec: "2, 2", img: "h2tabs" },
			{ id: "2x1", exec: "2, 3", img: "v2tabs" },
			{ id: "2x2", exec: "4, 4", img: "4tabs" }
		]);
	});
} else {
	var s = ['<label>View</label><br>'];
	var ar = ["1x1", "1x2", "2x1", "2x2"];
	for (var i = 0; i < ar.length; i++) {
		s.push('<label><input type="checkbox" id="!No', ar[i], '" />', ar[i], '</label>&nbsp;');
	}
	SetTabContents(0, "General", s);
}
