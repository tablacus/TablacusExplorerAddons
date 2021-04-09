if (!fso.FileExists(BuildPath(api.ILCreateFromPath(ssfFONTS).Path, "segmdl2.ttf"))) {
	return;
}

Sync.SegMDL2 = {
	general: {
		0: "0xe72b",
		1: "0xe72a",
		2: "0xe728",
		3: "0xe734",
		4: "0xe90c",
		5: "0xe8c6",
		6: "0xe8c8",
		7: "0xe77f",
		8: "0xe7a7",
		9: "0xe7a6",
		10: "0xe74d",
		11: "0xed0e",
		12: "0xe8dA",
		13: "0xe74e",
		14: "0xe7c5",
		15: "0xe771",
		16: "0xe897",
		17: "0xe721",
		19: "0xe749",
		20: "0xf0e2",
		21: "0xea37",
		22: "0xe71d",
		23: "0xe8fd",
		24: "0xe8cb",
		25: "0xe8cb",
		26: "0xe8cb",
		27: "0xe8cb",
		28: "0xe74a",
		29: "0xe8ce",
		30: "0xe8cd",
		31: "0xe8f4",
		32: "0xe71d",
		35: "0xe780",
		36: "0xec75",
		37: "0xf0e2",
		38: "0xea37",
		39: "0xe71d",
		40: "0xe8fd",
		43: "0xed43",
		44: "0xe8de",
		45: "0xf413",
	},
	browser: {
		0: "0xe72b",
		1: "0xe72a",
		2: "0xe711",
		3: "0xe72c",
		4: "0xe80f",
		5: "0xe721",
		6: "0xe728",
		7: "0xe749",
		8: "0xe8d2",
		9: "0xe929",
		10: "0xec7a",
		11: "0xe8d6",
		12: "0xe81c",
		13: "0xe8c3",
		14: "0xe8a7",
		15: "0xef6b",
		16: "0xe97a",
		18: "0xed1e",
		22: "0xe710",
	},
	shell32: {
		0: "0xe7c3",
		1: "0xf000",
		2: "0xe737",
		3: "0xe8b7",
		4: "0xe838",
		24: "0xe75a",
		42: "0xe977",
		289: "0xe8ec",
	}
}

for (let n in Sync.SegMDL2) {
	for (let i in Sync.SegMDL2[n]) {
		if (fso.FileExists(BuildPath(te.Data.DataFolder, "icons", n, i + ".png"))) {
			delete Sync.SegMDL2[n][i];
		}
	}
}

AddEvent("ReplaceIcon", function (s) {
	let res = /^icon:general,(\d+)|^bitmap:ieframe.dll,214,24,(\d+)|^bitmap:ieframe.dll,216,16,(\d+)/.exec(s);
	if (res) {
		if (s = Sync.SegMDL2.general[res[1] || res[2] || res[3]]) {
			return "font:Segoe MDL2 Assets," + s;
		}
	}
	res = /^icon:browser,(\d+)|^bitmap:ieframe.dll,204,24,(\d+)|^bitmap:ieframe.dll,206,16,(\d+)/.exec(s);
	if (res) {
		if (s = Sync.SegMDL2.browser[res[1] || res[2] || res[3]]) {
			return "font:Segoe MDL2 Assets," + s;
		}
	}
	res = /^icon:shell32.dll,(\d+)/.exec(s);
	if (res) {
		if (s = Sync.SegMDL2.shell32[res[1]]) {
			return "font:Segoe MDL2 Assets," + s;
		}
	}
});
