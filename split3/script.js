const Addon_Id = "split3";
const Default = "ToolBar1Right";
const item = GetAddonElement(Addon_Id);
Addons.Split3 = {
	ar: ["3x1", "1x3", "left1right2", "left2right1", "top1bottom2", "top2bottom1"],
	en: ["left", "right", "top", "bottom"],
	ww: [],

	Init: async function () {
		const ww = [];
		for (let i = 0; i < Addons.Split3.en.length; ++i) {
			ww.push(GetText(Addons.Split3.en[i]));
		}
		await Promise.all(ww).then(function (r) {
			Addons.Split3.ww = r;
		});
	},

	GetText: function (n) {
		for (j = Addons.Split3.en.length; j--;) {
			n = n.replace(Addons.Split3.en[j], Addons.Split3.ww[j]);
		}
		return n;
	}
}

if (window.Addon == 1) {
	Addons.Split3.Init();
	Addons.Split3.Exec = async function (nMax, nMode) {
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
			case 3:
				TC[0].Left = 0;
				TC[0].Top = 0;
				TC[0].Width = "50%";
				TC[0].Height = "100%";

				TC[1].Left = "50%";
				TC[1].Top = 0;
				TC[1].Width = "50%";
				TC[1].Height = "50%";

				TC[2].Left = "50%";
				TC[2].Top = "50%";
				TC[2].Width = "50%";
				TC[2].Height = "100%";
				break;
			case 4:
				TC[0].Left = 0;
				TC[0].Top = 0;
				TC[0].Width = "50%";
				TC[0].Height = "50%";

				TC[1].Left = 0;
				TC[1].Top = "50%";
				TC[1].Width = "50%";
				TC[1].Height = "50%";

				TC[2].Left = "50%";
				TC[2].Top = 0;
				TC[2].Width = "50%";
				TC[2].Height = "100%";
				break;
			case 5:
				TC[0].Left = 0;
				TC[0].Top = 0;
				TC[0].Width = "100%";
				TC[0].Height = "50%";

				TC[1].Left = 0;
				TC[1].Top = "50%";
				TC[1].Width = "50%";
				TC[1].Height = "50%";

				TC[2].Left = "50%";
				TC[2].Top = "50%";
				TC[2].Width = "50%";
				TC[2].Height = "50%";
				break;
			case 6:
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
				TC[2].Width = "100%";
				TC[2].Height = "50%";
				break;
		}
		const FV = await TC[0].Selected;
		FV.Focus();
		ChangeView(FV);
	};

	AddEvent("Layout", function () {
		return SetAddon(Addon_Id, Default, '<span id="' + Addon_Id + '"></span>');
	});

	AddEvent("Load", function () {
		if (!Addons.Split) {
			return;
		}
		const ar = [];
		for (let i = 0; i < Addons.Split3.ar.length; ++i) {
			ar.push({
				id: Addons.Split3.ar[i],
				exec: "3, " + (i + 1),
				name: Addons.Split3.GetText(Addons.Split3.ar[i]),
				ext: ".svg"
			});
		}
		Addons.Split.SetButtons(Addon_Id, Default, item, 3, ar);
	});
} else {
	await Addons.Split3.Init();
	const s = ['<label>View</label><br>'];
	for (let i = 0; i < Addons.Split3.ar.length; ++i) {
		s.push('<label><input type="checkbox" id="!No', Addons.Split3.ar[i], '">', Addons.Split3.GetText(Addons.Split3.ar[i]), '</label><br>');
	}
	SetTabContents(0, "General", s);
}
