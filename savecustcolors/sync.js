AddEvent("SaveConfig", function () {
	let s = "";
	for (let i = 0; i < 16; ++i) {
		s += GetWebColor(te.Data.CustColors[i]) + "\r\n";
	}
	if (s != Common.SaveCustColors) {
		WriteTextFile(BuildPath(te.Data.DataFolder, "config\\custcolors.txt"), s);
		Common.SaveCustColors = s;
	}
});

Common.SaveCustColors = ReadTextFile(BuildPath(te.Data.DataFolder, "config\\custcolors.txt"));
const ar = Common.SaveCustColors.split(/\r?\n/);
for (let i = 0; i < Math.min(16, ar.length); ++i) {
	te.Data.CustColors[i] = GetWinColor(ar[i])
}
