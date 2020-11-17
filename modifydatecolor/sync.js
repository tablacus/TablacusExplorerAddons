var Addon_Id = "modifydatecolor";
var item = GetAddonElement(Addon_Id);

Sync.ModifyDateColor = {
	Color: []
};

try {
	var smhdw = { s: 1000, m: 60000, h: 3600000, d: 86400000, w: 604800000, y: 31536000000 };
	var ado = OpenAdodbFromTextFile(BuildPath(te.Data.DataFolder, "config\\modifydatecolor.tsv"));
	while (!ado.EOS) {
		var ar = ado.ReadText(adReadLine).split("\t");
		if (ar[0]) {
			var s = ar[0].replace(/([\dx]+)([smhdwy])/ig, function (all, re1, re2) {
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
		var d = new Date() - pid.ModifyDate;
		for (var i = Sync.ModifyDateColor.Color.length; i--;) {
			var ar = Sync.ModifyDateColor.Color[i];
			if (d < ar[0]) {
				if (ar[1] != -1) {
					vcd.clrText = ar[1];
					return S_OK;
				} else {
					return;
				}
			}
		}
	}
});
