const Addon_Id = "split9";
const Default = "ToolBar1Right";
const item = GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.Split9 = {
		Exec: async function (nMax, nMode) {
			if (!Addons.Split) {
				return;
			}
			const TC = [await te.Ctrl(CTRL_TC)];
			await Addons.Split.Exec2(nMax, TC);
			TC[0].Left = 0;
			TC[0].Top = 0;
			TC[0].Width = "33.33%";
			TC[0].Height = "33.33%";

			TC[1].Left = "33.33%";
			TC[1].Top = 0;
			TC[1].Width = "33.33%";
			TC[1].Height = "33.33%";

			TC[2].Left = "66.66%";
			TC[2].Top = 0;
			TC[2].Width = "33.33%";
			TC[2].Height = "33.33%";

			TC[3].Left = 0;
			TC[3].Top = "33.33%";
			TC[3].Width = "33.33%";
			TC[3].Height = "33.33%";

			TC[4].Left = "33.33%";
			TC[4].Top = "33.33%";
			TC[4].Width = "33.33%";
			TC[4].Height = "33.33%";

			TC[5].Left = "66.66%";
			TC[5].Top = "33.33%";
			TC[5].Width = "33.33%";
			TC[5].Height = "33.33%";

			TC[6].Left = 0;
			TC[6].Top = "66.66%";
			TC[6].Width = "33.33%";
			TC[6].Height = "33.33%";

			TC[7].Left = "33.33%";
			TC[7].Top = "66.66%";
			TC[7].Width = "33.33%";
			TC[7].Height = "33.33%";

			TC[8].Left = "66.66%";
			TC[8].Top = "66.66%";
			TC[8].Width = "33.33%";
			TC[8].Height = "33.33%";

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
		Addons.Split.SetButtons(Addon_Id, Default, item, 9, [
			{ id: "3x3", exec: "9, 1", ext: ".svg" }
		]);
	});
}

