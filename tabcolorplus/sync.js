Sync.TabColorPlus = {
	cc: [],
	Color: []
};
const re = /^\/(.*)\/(.*)/;
try {
	const ado = api.CreateObject("ads");
	ado.CharSet = "utf-8";
	ado.Open();
	ado.LoadFromFile(fso.BuildPath(te.Data.DataFolder, "config\\tabcolorplus.tsv"));
	while (!ado.EOS) {
		const ar = ado.ReadText(adReadLine).split("\t");
		if (ar[0] != "") {
			const res = re.exec(ar[0]);
			Sync.TabColorPlus.cc.push(res ? new RegExp(res[1], res[2]) : ar[0]);
			Sync.TabColorPlus.Color.push(ar[1]);
		}
	}
	ado.Close();
} catch (e) { }

AddEvent("GetTabColor", function (Ctrl) {
	const path = api.GetDisplayNameOf(Ctrl, SHGDN_FORPARSING);
	const path2 = api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
	for (let i in Sync.TabColorPlus.cc) {
		const cc = Sync.TabColorPlus.cc[i];
		if (cc.test ? cc.test(path) || cc.test(path2) : api.PathMatchSpec(path, cc) || api.PathMatchSpec(path2, cc)) {
			return Sync.TabColorPlus.Color[i];
		}
	}
});
