const Addon_Id = "split12";
const Default = "ToolBar1Right";
const item = GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.Split12 = {
		Exec: async function (nMax, nMode) {
			if (!Addons.Split) {
				return;
			}
			const TC = [await te.Ctrl(CTRL_TC)];
			await Addons.Split.Exec2(nMax, TC);
			TC[0].Left = 0;
			TC[0].Top = 0;
			TC[0].Width = "25%";
			TC[0].Height = "33.33%";

			TC[1].Left = "25%";
			TC[1].Top = 0;
			TC[1].Width = "25%";
			TC[1].Height = "33.33%";

			TC[2].Left = "50%";
			TC[2].Top = 0;
			TC[2].Width = "25%";
			TC[2].Height = "33.33%";

			TC[3].Left = "75%";
			TC[3].Top = 0;
			TC[3].Width = "25%";
			TC[3].Height = "33.33%";

			TC[4].Left = 0;
			TC[4].Top = "33.33%";
			TC[4].Width = "25%";
			TC[4].Height = "33.33%";

			TC[5].Left = "25%";
			TC[5].Top = "33.33%";
			TC[5].Width = "25%";
			TC[5].Height = "33.33%";

			TC[6].Left = "50%";
			TC[6].Top = "33.33%";
			TC[6].Width = "25%";
			TC[6].Height = "33.33%";

			TC[7].Left = "75%";
			TC[7].Top = "33.33%";
			TC[7].Width = "25%";
			TC[7].Height = "33.33%";

			TC[8].Left = 0;
			TC[8].Top = "66.66%";
			TC[8].Width = "25%";
			TC[8].Height = "33.33%";

			TC[9].Left = "25%";
			TC[9].Top = "66.66%";
			TC[9].Width = "25%";
			TC[9].Height = "33.33%";

			TC[10].Left = "50%";
			TC[10].Top = "66.66%";
			TC[10].Width = "25%";
			TC[10].Height = "33.33%";

			TC[11].Left = "75%";
			TC[11].Top = "66.66%";
			TC[11].Width = "25%";
			TC[11].Height = "33.33%";

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
		Addons.Split.SetButtons(Addon_Id, Default, item, 12, [
			{ id: "4x3", exec: "12, 1", ext: ".svg" }
		]);
	});
}

