if (window.Addon == 1) {
	Addons.TabColorPlus = {
		cc: [],
		Color: []
	};
	var re = /^\/(.*)\/(.*)/;
	try {
		var ado = te.CreateObject("Adodb.Stream");
		ado.CharSet = "utf-8";
		ado.Open();
		ado.LoadFromFile(fso.BuildPath(te.Data.DataFolder, "config\\tabcolorplus.tsv"));
		while (!ado.EOS) {
			var ar = ado.ReadText(adReadLine).split("\t");
			if (ar[0] != "") {
				Addons.TabColorPlus.cc.push(re.test(ar[0]) ? new RegExp(RegExp.$1, RegExp.$2) : ar[0]);
				Addons.TabColorPlus.Color.push(ar[1]);
			}
		}
		ado.Close();
	}
	catch (e) {
	}

	AddEvent("GetTabColor", function (Ctrl)
	{
		var path = api.GetDisplayNameOf(Ctrl, SHGDN_FORPARSING);
		for (var i in Addons.TabColorPlus.cc) {
			var cc = Addons.TabColorPlus.cc[i];
			if (cc.test ? cc.test(path) : api.PathMatchSpec(path, cc)) {
				return Addons.TabColorPlus.Color[i];
			}
		}
	});
}
