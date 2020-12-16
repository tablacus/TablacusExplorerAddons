const Addon_Id = "filtercolor";
const item = GetAddonElement(Addon_Id);

Sync.FilterColor = {
	List: [],
	Mode: GetNum(item.getAttribute("Path")) ? "Path" : "Name"
};
try {
	const ado = OpenAdodbFromTextFile(BuildPath(te.Data.DataFolder, "config", Addon_Id + ".tsv"));
	while (!ado.EOS) {
		const ar = ado.ReadText(adReadLine).split("\t");
		if (ar[0]) {
			Sync.FilterColor.List.push([ar[0], GetWinColor(ar[1])]);
		}
	}
	ado.Close();
} catch (e) { }

AddEvent("ItemPrePaint", function (Ctrl, pid, nmcd, vcd, plRes) {
	if (pid) {
		const path = pid[Sync.FilterColor.Mode];
		for (let i = Sync.FilterColor.List.length; i--;) {
			if (PathMatchEx(path, Sync.FilterColor.List[i][0])) {
				vcd.clrText = Sync.FilterColor.List[i][1];
				return S_OK;
			}
		}
	}
});
