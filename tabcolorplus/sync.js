Sync.TabColorPlus = {
	cc: [],
	Color: [],
	db: {}
};
const re = /^\/(.*)\/(.*)/;
try {
	const ado = api.CreateObject("ads");
	ado.CharSet = "utf-8";
	ado.Open();
	ado.LoadFromFile(BuildPath(te.Data.DataFolder, "config\\tabcolorplus.tsv"));
	while (!ado.EOS) {
		const ar = ado.ReadText(adReadLine).split("\t");
		if (ar[0] != "") {
			let cc = ar.shift();
			const res = re.exec(cc);
			if (res || /\*|\?/.test(cc)) {
				Sync.TabColorPlus.cc.push(res ? new RegExp(res[1], res[2]) : cc);
				Sync.TabColorPlus.Color.push(ar.join("\n"));
				continue;
			}
			const a2 = cc.toLowerCase().split(/;/);
			for (let i = 0; i < a2.length; ++i) {
				const n = a2[i].replace(/^\s+|\s+$/g, "");
				if (Sync.TabColorPlus.db[n]) {
					continue;
				}
				Sync.TabColorPlus.db[n] = ar.join("\n");
			}
		}
	}
	ado.Close();
} catch (e) { }

AddEvent("GetTabColor", function (Ctrl) {
	const path = api.GetDisplayNameOf(Ctrl, SHGDN_FORPARSING);
	const path2 = api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
	const r = Sync.TabColorPlus.db[path.toLowerCase()] || Sync.TabColorPlus.db[path2.toLowerCase()];
	if (r) {
		return r;
	}
	for (let i = 0; i < Sync.TabColorPlus.cc.length; ++i) {
		const cc = Sync.TabColorPlus.cc[i];
		if (cc.test ? cc.test(path) || cc.test(path2) : api.PathMatchSpec(path, cc) || api.PathMatchSpec(path2, cc)) {
			return Sync.TabColorPlus.Color[i];
		}
	}
});
