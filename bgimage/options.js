SetTabContents(4, "", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));

const arIndex = ["Filter", "Path"];
const fnConfig = BuildPath(ui_.DataFolder, "config\\bgimage.tsv");

async function SaveIC(mode) {
	if (g_Chg[mode]) {
		let data = "";
		for (let i = 0; i < g_x.List.length; ++i) {
			const line = g_x.List[i].value.replace(new RegExp(g_sep, "g"), "\t");
			if (line != "\t") {
				data += line + "\r\n";
			}
		}
		await WriteTextFile(fnConfig, data);
	}
}

EditIC = function () {
	if (g_x.List.selectedIndex < 0) {
		return;
	}
	ClearX("List");
	const a = g_x.List[g_x.List.selectedIndex].value.split(g_sep);
	for (let i = arIndex.length; i--;) {
		const el = document.E.elements[arIndex[i]];
		if (SameText(el.type, 'checkbox')) {
			el.checked = a[i];
		} else {
			el.value = a[i] || "";
		}
	}
	ShowIconX();
	document.E.Filter.value = document.E.Filter.value;
}

ReplaceIC = function (mode) {
	ClearX();
	if (g_x[mode].selectedIndex < 0) {
		g_x[mode].selectedIndex = ++g_x[mode].length - 1;
	}
	const a = [];
	for (let i = arIndex.length; i--;) {
		const el = document.E.elements[arIndex[i]];
		if (SameText(el.type, 'checkbox')) {
			a.unshift(el.checked ? 1 : 0);
		} else {
			a.unshift(el.value);
		}
	}
	SetData(g_x.List[g_x.List.selectedIndex], a);
	g_Chg[mode] = true;
}

ShowIconX = async function () {
	document.getElementById('Image1').src = await MakeImgSrc(document.E.Path.value, 0, true);
}

GetCurrentPath = function () {
	ConfirmThenExec(GetText("Get the current folder view"), async function () {
		document.E.Filter.value = await te.Ctrl(CTRL_FV).FolderItem.Path;
	});
}

g_x.List = document.E.List;

const ar = (await ReadTextFile(fnConfig)).split("\n");
for (let i = 0; i < ar.length; ++i) {
	if (/\t/.test(ar[i])) {
		++g_x.List.length;
		SetData(g_x.List[i], ar[i].replace(/^\s|\s$/g, "").split("\t"));
	}
}

EnableSelectTag(g_x.List);

SaveLocation = async function () {
	if (g_Chg.Data) {
		ReplaceIC("List");
	}
	await SaveIC("List");
};
