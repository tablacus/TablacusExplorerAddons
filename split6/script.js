const Addon_Id = "split6";
const Default = "ToolBar1Right";
const item = GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.Split6 = {
		Exec: async function (nMax, nMode) {
			if (!Addons.Split) {
				return;
			}
			const TC = [await te.Ctrl(CTRL_TC)];
			await Addons.Split.Exec2(nMax, TC);
			switch (nMode) {
				case 1:
					TC[0].Left = 0;
					TC[0].Top = 0;
					TC[0].Width = "33.33%";
					TC[0].Height = "50%";

					TC[1].Left = "33.33%";
					TC[1].Top = 0;
					TC[1].Width = "33.33%";
					TC[1].Height = "50%";

					TC[2].Left = "66.66%";
					TC[2].Top = 0;
					TC[2].Width = "33.33%";
					TC[2].Height = "50%";

					TC[3].Left = 0;
					TC[3].Top = "50%";
					TC[3].Width = "33.33%";
					TC[3].Height = "50%";

					TC[4].Left = "33.33%";
					TC[4].Top = "50%";
					TC[4].Width = "33.33%";
					TC[4].Height = "50%";

					TC[5].Left = "66.66%";
					TC[5].Top = "50%";
					TC[5].Width = "33.33%";
					TC[5].Height = "50%";
					break;
				case 2:
					TC[0].Left = 0;
					TC[0].Top = 0;
					TC[0].Width = "50%";
					TC[0].Height = "33.33%";

					TC[1].Left = "50%";
					TC[1].Top = 0;
					TC[1].Width = "50%";
					TC[1].Height = "33.33%";

					TC[2].Left = 0;
					TC[2].Top = "33.33%";
					TC[2].Width = "50%";
					TC[2].Height = "33.33%";

					TC[3].Left = "50%";
					TC[3].Top = "33.33%";
					TC[3].Width = "50%";
					TC[3].Height = "33.33%";

					TC[4].Left = 0;
					TC[4].Top = "66.66%";
					TC[4].Width = "50%";
					TC[4].Height = "33.33%";

					TC[5].Left = "50%";
					TC[5].Top = "66.66%";
					TC[5].Width = "50%";
					TC[5].Height = "33.33%";
					break;
			}
			const FV = await TC[0].Selected;
			FV.Focus();
			ChangeView(FV);
		}
	};

	AddEvent("Layout", function () {
		return SetAddon(Addon_Id, Default, '<span id="' + Addon_Id + '"></span>');
	});

	AddEvent("Load", function () {
		if (!Addons.Split) {
			return;
		}
		Addons.Split.SetButtons(Addon_Id, Default, item, 6, [
			{ id: "3x2", exec: "6, 1", ext: ".svg" },
			{ id: "2x3", exec: "6, 2", ext: ".svg" }
		]);
	});
} else {
	const s = ['<label>View</label><br>'];
	const ar = ["3x2", "2x3"];
	for (let i = 0; i < ar.length; i++) {
		s.push('<label><input type="checkbox" id="!No', ar[i], '">', ar[i], '</label>&nbsp;');
	}
	SetTabContents(0, "General", s);
}

