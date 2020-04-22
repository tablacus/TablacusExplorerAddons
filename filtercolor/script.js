var Addon_Id = "filtercolor";

var item = GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.FilterColor = {
		List: [],
		Mode: api.LowPart(item.getAttribute("Path")) ? "Path" : "Name"
	};
	try {
		var ado = OpenAdodbFromTextFile(fso.BuildPath(te.Data.DataFolder, "config\\" + Addon_Id + ".tsv"));
		while (!ado.EOS) {
			var ar = ado.ReadText(adReadLine).split("\t");
			if (ar[0]) {
				Addons.FilterColor.List.push([ar[0], GetWinColor(ar[1])]);
			}
		}
		ado.Close();
	} catch (e) { }

	AddEvent("ItemPrePaint", function (Ctrl, pid, nmcd, vcd, plRes) {
		if (pid) {
			var path = pid[Addons.FilterColor.Mode];
			for (var i = Addons.FilterColor.List.length; i--;) {
				if (PathMatchEx(path, Addons.FilterColor.List[i][0])) {
					vcd.clrText = Addons.FilterColor.List[i][1];
					return S_OK;
				}
			}
		}
	});
} else {
	hint = GetText("Filter");
	importScript("addons\\" + Addon_Id + "\\options.js");
}
