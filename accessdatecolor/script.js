var Addon_Id = "accessdatecolor";

var item = GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.AccessDateColor = {
		Color: []
	};
	try {
		var smhdw = {s: 1000, m: 60000,  h:3600000, d: 86400000, w: 604800000, y: 31536000000 };
		var ado = OpenAdodbFromTextFile(fso.BuildPath(te.Data.DataFolder, "config\\accessdatecolor.tsv"));
		var tzo = new Date().getTimezoneOffset() * 60000;
		while (!ado.EOS) {
			var ar = ado.ReadText(adReadLine).split("\t");
			if (ar[0]) {
				var s = (ar[0].replace(/([\dx]+)([smhdwy])/ig, function (all, re1, re2)
				{
					return eval(re1.replace(/x/ig, "*")) * smhdw[re2.toLowerCase()] + '+';
				}).replace(/\+$/, "")) - tzo;
				Addons.AccessDateColor.Color.push([s, ar[1] ? GetWinColor(ar[1]) : -1]);
			}
		}
		ado.Close();
	} catch (e) {}

	Addons.AccessDateColor.Color = Addons.AccessDateColor.Color.sort(function (a, b)
	{
		return b[0] - a[0];
	});

	AddEvent("ItemPrePaint", function (Ctrl, pid, nmcd, vcd, plRes)
	{
		if (pid) {
			var d = new Date() - pid.ExtendedProperty("Access");
			for (var i = Addons.AccessDateColor.Color.length; i--;) {
				var ar = Addons.AccessDateColor.Color[i];
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
} else {
	hint = "1s 1m 1h 1d 1w 1y";
	importScript("addons\\" + Addon_Id + "\\options.js");
}
