const Addon_Id = "modifydatecolor";
const item = GetAddonElement(Addon_Id);

Sync.ModifyDateColor = {
	Color: []
};

try {
	const smhdw = { s: 1000, m: 60000, h: 3600000, d: 86400000, w: 604800000, y: 31536000000 };
	const ado = OpenAdodbFromTextFile(BuildPath(te.Data.DataFolder, "config\\modifydatecolor.tsv"));
	while (!ado.EOS) {
		const ar = ado.ReadText(adReadLine).split("\t");
		if (ar[0]) {
			const s = ar[0].replace(/([\dx]+)([smhdwy])/ig, function (all, re1, re2) {
				return eval(re1.replace(/x/ig, "*")) * smhdw[re2.toLowerCase()] + '+';
			}).replace(/\+$/, "");
			Sync.ModifyDateColor.Color.push([s, ar[1] ? GetWinColor(ar[1]) : -1]);
		}
	}
	ado.Close();
} catch (e) { }

Sync.ModifyDateColor.Color = Sync.ModifyDateColor.Color.sort(function (a, b) {
	return b[0] - a[0];
});

AddEvent("ItemPrePaint", function (Ctrl, pid, nmcd, vcd, plRes) {
	if (pid) {
		const d = new Date() - pid.ModifyDate;
		for (let i = Sync.ModifyDateColor.Color.length; i--;) {
			const ar = Sync.ModifyDateColor.Color[i];
			if (d < ar[0]) {
				if (ar[1] != -1) {
					vcd.clrText = ar[1];
					return S_OK;
				}
				return;
			}
		}
	}
});
