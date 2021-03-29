const Addon_Id = "split8";
const Default = "ToolBar1Right";
const item = await GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.Split8 = {
		Exec: async function (nMax, nMode) {
			if (!Addons.Split) {
				return;
			}
			const TC = [await te.Ctrl(CTRL_TC)];
			await Addons.Split.Exec2(nMax, TC);
			TC[0].Left = 0;
			TC[0].Top = 0;
			TC[0].Width = "25%";
			TC[0].Height = "50%";

			TC[1].Left = "25%";
			TC[1].Top = 0;
			TC[1].Width = "25%";
			TC[1].Height = "50%";

			TC[2].Left = "50%";
			TC[2].Top = 0;
			TC[2].Width = "25%";
			TC[2].Height = "50%";

			TC[3].Left = "75%";
			TC[3].Top = 0;
			TC[3].Width = "25%";
			TC[3].Height = "50%";

			TC[4].Left = 0;
			TC[4].Top = "50%";
			TC[4].Width = "25%";
			TC[4].Height = "50%";

			TC[5].Left = "25%";
			TC[5].Top = "50%";
			TC[5].Width = "25%";
			TC[5].Height = "50%";

			TC[6].Left = "50%";
			TC[6].Top = "50%";
			TC[6].Width = "25%";
			TC[6].Height = "50%";

			TC[7].Left = "75%";
			TC[7].Top = "50%";
			TC[7].Width = "25%";
			TC[7].Height = "50%";

			TC[0].Selected.Focus();
			RunEvent1("VisibleChanged", TC[0]);
		}
	};

	AddEvent("Layout", function () {
		SetAddon(Addon_Id, Default, '<span id="' + Addon_Id + '"></span>');
	});

	AddEvent("Load", function () {
		if (!Addons.Split) {
			return;
		}
		Addons.Split.SetButtons(Addon_Id, Default, item, 8, [
			{ id: "4x2", exec: "8, 1" }
		]);
	});
}

