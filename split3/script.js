var Addon_Id = "split3";
var Default = "ToolBar1Right";

var item = GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.Split3 =
	{
		Exec: function (nMax, nMode)
		{
			var TC = [te.Ctrl(CTRL_TC)];
			Addons.Split.Exec2(nMax, TC);
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
		}

	};

	SetAddon(Addon_Id, Default, '<span id="' + Addon_Id + '"></span>');

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
