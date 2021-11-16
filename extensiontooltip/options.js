ConfigFile = BuildPath(ui_.DataFolder, "config", Addon_Id + ".json");

SetTabContents(4, "General", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));

SaveIC = async function (mode) {
	if (g_Chg[mode]) {
		const data = {};
		for (let i = 0; i < g_x.List.length; i++) {
			const ar = g_x.List[i].value.split(g_sep);
			data[ar[0]] = ar[1];
		}
		await WriteTextFile(ConfigFile, JSON.stringify(data));
		g_Chg[mode] = false;
	}
}

EditIC = function (mode) {
	if (g_x.List.selectedIndex < 0) {
		return;
	}
	ClearX("List");
	const a = g_x.List[g_x.List.selectedIndex].value.split(g_sep);
	for (let i = arIndex.length; i--;) {
		document.E.elements[arIndex[i]].value = a[i] || "";
	}
}

ReplaceIC = function (mode) {
	ClearX();
	if (g_x[mode].selectedIndex < 0) {
		g_x[mode].selectedIndex = ++g_x[mode].length - 1;
	}
	const a = [];
	for (let i = arIndex.length; i--;) {
		a.unshift(document.E.elements[arIndex[i]].value);
	}
	SetData(g_x.List[g_x.List.selectedIndex], a);
	g_Chg[mode] = true;
}

SaveLocation = async function () {
	if (g_Chg.Data) {
		ReplaceIC("List");
	}
	await SaveIC("List");
};

BrowseType = async function (el) {
	const f = await sha.NameSpace(ui_.Installed);
	let ar = [];
	for (let i = 0; i < 999; ++i) {
		ar.push(f.GetDetailsOf(null, i));
	}
	ar = await Promise.all(ar);
	const hMenu = await api.CreatePopupMenu();
	for (let i = 0; i < ar.length; ++i) {
		if (ar[i]) {
			await api.InsertMenu(hMenu, i, MF_BYPOSITION | MF_STRING, i + 1, ar[i]);
		}
	}
	const pt = GetPos(el, 9);
	const nVerb = await api.TrackPopupMenuEx(hMenu, TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, ui_.hwnd, null, null);
	api.DestroyMenu(hMenu);
	if (nVerb) {
		const s = PathQuoteSpaces(ar[nVerb - 1]);
		if (document.E.Data.value) {
			document.E.Data.value += "\n" + s;
		} else {
			document.E.Data.value = s;
		}
	}
}

setTimeout(async function () {
	g_x.List = document.E.List;

	const db = JSON.parse((await ReadTextFile(ConfigFile)) || "{}");
	for (let name in db) {
		const i = g_x.List.length++;
		SetData(g_x.List[i], [name, db[name]]);
	}
	EnableSelectTag(g_x.List);
}, 99);
