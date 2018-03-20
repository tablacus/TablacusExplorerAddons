if (window.Addon == 1) {
	Addons.SaveCustColors =
	{
		ar: [],
	}
	AddEvent("SaveConfig", function ()
	{
		for (var i = 0; i < 16; i++) {
			if (te.Data.CustColors[i] != Addons.SaveCustColors.ar[i]) {
				try {
					var ado = new ActiveXObject(api.ADBSTRM);
					ado.CharSet = "utf-8";
					ado.Open();
					for (var j = 0; j < 16; j++) {
						ado.WriteText(GetWebColor(te.Data.CustColors[j]) + "\r\n");
					}
					ado.SaveToFile(fso.BuildPath(te.Data.DataFolder, "config\\custcolors.txt"), adSaveCreateOverWrite);
					ado.Close();
				} catch (e) {}
				break;
			}
		}
	});

	try {
		var ado = OpenAdodbFromTextFile(fso.BuildPath(te.Data.DataFolder, "config\\custcolors.txt"));
		if (ado) {
			Addons.SaveCustColors.ar = ado.ReadText(adReadAll).split(/[\s,]+/);
			for (var i = 0; i < 16; i++) {
				te.Data.CustColors[i] = Addons.SaveCustColors.ar[i] = GetWinColor(Addons.SaveCustColors.ar[i])
			}
			ado.Close();
		}
	} catch (e) {}
}
