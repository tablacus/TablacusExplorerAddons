if (window.Addon == 1) {
	Addons.ExtensionColor = {
		Color: {}
	};
	var re = /^\/(.*)\/(.*)/;
	try {
		var ado = te.CreateObject("Adodb.Stream");
		ado.CharSet = "utf-8";
		ado.Open();
		ado.LoadFromFile(fso.BuildPath(te.Data.DataFolder, "config\\extensioncolor.tsv"));
		while (!ado.EOS) {
			var ar = ado.ReadText(adReadLine).split("\t");
			if (ar[0] != "") {
				Addons.ExtensionColor.Color[ar[0]] = GetWinColor(ar[1]);
			}
		}
		ado.Close();
	}
	catch (e) {
	}

	AddEvent("ItemPrePaint", function (Ctrl, pid, nmcd, vcd, plRes)
	{
		if (pid) {
			var c = Addons.ExtensionColor.Color[fso.GetExtensionName(api.GetDisplayNameOf(pid, SHGDN_FORPARSING))];
			if (isFinite(c)) {
				vcd.clrText = c;
				return S_OK;
			}
		}
	});
}
