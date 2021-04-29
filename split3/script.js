const Addon_Id = "split3";
const Default = "ToolBar1Right";
const item = await GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.Split3 = {
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
		Addons.Split.SetButtons(Addon_Id, Default, item, 3, [
			{ id: "3x1", exec: "3, 1" },
			{ id: "1x3", exec: "3, 2" }
		]);
	});
} else {
	const s = ['<label>View</label><br>'];
	const ar = ["3x1", "1x3"];
	for (let i = 0; i < ar.length; i++) {
		s.push('<label><input type="checkbox" id="!No', ar[i], '">', ar[i], '</label>&nbsp;');
	}
	SetTabContents(0, "General", s);
}
