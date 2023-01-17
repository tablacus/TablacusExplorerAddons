SetTabContents(4, "General", '<form name="E" id="data1"><table id="T" class="full"></table></form>');
document.getElementById("toolbar").innerHTML = '<button onclick=\'Add(["",""])\'>Add</button>&emsp;<button onclick="Up()">Up</button><button onclick="Down()">Down</button>&emsp;<button onclick="Remove()">Remove</button>';

Addons.QuickNotes = {
	Types: ["All", "List", "Tree"],
	Config: BuildPath(await te.Data.DataFolder, "config", Addon_Id + ".tsv"),

	Load: async function () {
		for (let data = (await ReadTextFile(Addons.QuickNotes.Config)).split(/\r?\n/); data.length;) {
			Add(data.shift().split("\t"));
		}
	}
}

Get = async function (i) {
	const el = document.E['t' + i];
	return [document.E['n' + i].value, el[el.selectedIndex].value, await GetKeyKeyG(document.E['k' + i].value)];
}

Set = async function (i, ar) {
	document.E['n' + i].value = ar[0] || "";
	SetType(document.E['t' + i], ar[1] || "All");
	document.E['k' + i].value = await GetKeyNameG(ar[2]) || "";
}

Add = function (ar) {
	if (ar.length < 2) {
		return;
	}
	const table = document.getElementById("T");
	const nRows = table.rows.length;
	s = ['<td><input type="radio" name="sel" id="i', nRows, '"></td>'];
	s.push('<td class="full"><input type="text" name="n', nRows, '" class="full" onchange="ContentChanged()" placeholder="Name" title="Name"></td>');
	s.push('<td><select name="t', nRows, '" class="translate">');
	for (let i = 0; i < Addons.QuickNotes.Types.length; ++i) {
		s.push('<option value="', Addons.QuickNotes.Types[i], '">', Addons.QuickNotes.Types[i], '</option>');
	}
	s.push('</select></td>');
	s.push('<td><input type="text" name="k', nRows, '" style="width: 12em" placeholder="Key" onchange="ContentChanged(this)" ></td>');
	s.push('<td><button onclick="BrowseKey(this, ', nRows, ')" title="Key">Browse...</button></td>');
	const tr = table.insertRow();
	tr.style.display = "none";
	tr.innerHTML = s.join("");
	Promise.all([Set(nRows, ar), ApplyLang(tr), tr]).then(function (r) {
		r[2].style.display = "";
	});
	return tr;
}

GetIndex = function () {
	const table = document.getElementById("T");
	for (let i = table.rows.length; i--;) {
		if (document.getElementById("i" + i).checked) {
			return i;
		}
	}
	return -1;
}

Up = async function () {
	let nPos = GetIndex();
	if (nPos <= 0) {
		return;
	}
	const s = await Get(nPos);
	await Set(nPos, await Get(nPos - 1));
	Set(--nPos, s);
	document.E["i" + nPos].checked = true;
}

Down = async function () {
	const table = document.getElementById("T");
	let nPos = GetIndex();
	if (nPos < 0 || nPos >= table.rows.length - 1) {
		return;
	}
	const s = await Get(nPos);
	await Set(nPos, await Get(nPos + 1));
	Set(++nPos, s);
	document.E["i" + nPos].checked = true;
}

Remove = async function () {
	const nPos = GetIndex();
	if (nPos < 0) {
		return;
	}
	ConfirmThenExec(GetText("Remove"), async function () {
		const table = document.getElementById("T");
		const nRows = table.rows.length;
		for (let i = nPos; i < nRows - 1; i++) {
			await Set(i, await Get(i + 1));
		}
		table.deleteRow(nRows - 1);
	});
}

ContentChanged = function () {
	g_bChanged = true;
}

BrowseKey = async function (el, i) {
	const elType = document.E['t' + i];
	const KeyMode = await MainWindow.eventTE.Key[elType[elType.selectedIndex].value];
	if (KeyMode) {
		let r = [];
		const Keys = await ObjectKeys(KeyMode, window.chrome);
		for (let j = 0; j < Keys.length; ++j) {
			r.push(GetKeyName("$" + (Number(Keys[j]).toString(16))));
		}
		r = await Promise.all(r);
		const hMenu = await api.CreatePopupMenu();
		const pt = GetPos(el, 9);
		for (let j = 0; j < r.length; ++j) {
			api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, j + 1, r[j] || "$" + (Number(Keys[j]).toString(16)));
		}
		const nVerb = await api.TrackPopupMenuEx(hMenu, TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, ui_.hwnd, null);
		api.DestroyMenu(hMenu);
		if (nVerb) {
			document.E['k' + i].value = r[nVerb - 1];
			document.E['n' + i].value = "";
			const k = Keys[nVerb - 1];
			const f = KeyMode[k];
			const o = f[0];
			const cmd = await o[0];
			if ("string" === typeof cmd) {
				document.E['n' + i].value = (await MainWindow.OptionDecode(await o[1], cmd)).split(/[\r\n]/)[0];
			}
		}
	}
}

SaveLocation = async function () {
	try {
		const ado = await api.CreateObject("ads");
		ado.CharSet = "utf-8";
		await ado.Open();
		const table = document.getElementById("T");
		const nRows = table.rows.length;
		let ar = [];
		for (let i = 0; i < nRows; i++) {
			ar.push(Get(i));
		}
		ar = await Promise.all(ar);
		let s, data = "";
		while (s = ar.shift()) {
			data += s.join("\t") + "\r\n";
		}
		await ado.WriteText(data);
		await ado.SaveToFile(Addons.QuickNotes.Config, adSaveCreateOverWrite);
		ado.Close();
	} catch (e) { }
}

window.OnTabChanged = function (i) {
	document.getElementById("toolbar").style.visibility = i == 4 ? "" : "hidden";
}

setTimeout(Addons.QuickNotes.Load);
