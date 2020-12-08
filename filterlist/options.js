Addons.FilterList = {
	Add: function (ar) {
		if (ar.length < 2) {
			return;
		}
		const table = document.getElementById("T");
		let nRows = table.rows.length;
		s = ['<td><input type="radio" name="sel" id="i', nRows, '"></td>'];
		s.push('<td style="width: 30%"><input type="text" name="n', nRows, '" style="width: 100%" placeholder="Name" title="Name"></td>');
		s.push('<td style="width: 70%"><input type="text" name="f', nRows, '" style="width: 100%" placeholder="Filter" title="Filter"></td>');
		const tr = table.insertRow();
		tr.innerHTML = s.join("");
		Addons.FilterList.Set(nRows, ar);
		return tr;
	},

	Get: function (i) {
		return [document.E.elements['n' + i].value, document.E.elements['f' + i].value].join("\t");
	},

	Set: function (i, ar) {
		if ("string" === typeof ar) {
			ar = ar.split("\t");
		}
		document.E.elements['n' + i].value = ar[0];
		document.E.elements['f' + i].value = ar[1];
	},

	GetIndex: function () {
		const table = document.getElementById("T");
		for (let i = table.rows.length; i--;) {
			if (document.getElementById("i" + i).checked) {
				return i;
			}
		}
		return -1;
	},

	Up: function () {
		let nPos = Addons.FilterList.GetIndex();
		if (nPos <= 0) {
			return;
		}
		const s = Addons.FilterList.Get(nPos);
		Addons.FilterList.Set(nPos, Addons.FilterList.Get(nPos - 1));
		Addons.FilterList.Set(--nPos, s);
		document.E.elements["i" + nPos].checked = true;
	},

	Down: function () {
		const table = document.getElementById("T");
		let nPos = Addons.FilterList.GetIndex();
		if (nPos < 0 || nPos >= table.rows.length - 1) {
			return;
		}
		const s = Addons.FilterList.Get(nPos);
		Addons.FilterList.Set(nPos, Addons.FilterList.Get(nPos + 1));
		Addons.FilterList.Set(++nPos, s);
		document.E.elements["i" + nPos].checked = true;
	},

	Remove: async function () {
		const nPos = Addons.FilterList.GetIndex();
		if (nPos < 0 || !await confirmOk()) {
			return;
		}
		const table = document.getElementById("T");
		const nRows = table.rows.length;
		for (let i = nPos; i < nRows - 1; i++) {
			Addons.FilterList.Set(i, Addons.FilterList.Get(i + 1));
		}
		table.deleteRow(nRows - 1);
	},

	Resize: function () {
		let h = document.documentElement.clientHeight || document.body.clientHeight;
		const i = (g_.Inline ? 70 : 99);
		h -= i > 34 ? i : 34;
		if (h > 0) {
			document.getElementById("panel0f").style.height = h + 'px';
		}
	}
}

var ar = (await ReadTextFile(BuildPath(ui_.Installed, "addons", Addon_Id, "options.html"))).split("<!--panel-->");
SetTabContents(0, "View", ar[0]);
SetTabContents(4, "General", ar[1]);

const data = (await ReadTextFile(BuildPath(await te.Data.DataFolder, "config", Addon_Id + ".tsv"))).split(/\r?\n/);
while (data.length) {
	Addons.FilterList.Add(data.shift());
}
if (ui_.IEVer < 9) {
	Addons.FilterList.Resize();
	AddEventEx(window, "resize", function () {
		clearTimeout(Addons.FilterList.tid);
		Addons.FilterList.tid = setTimeout(Addons.FilterList.Resize, 99);
	});
}

SaveLocation = async function () {
	const table = document.getElementById("T");
	const nRows = table.rows.length;
	let data = "";
	const empty = ["", ""].join("\t");
	for (let i = 0; i < nRows; i++) {
		const s = Addons.FilterList.Get(i);
		if (s != empty) {
			data += s + "\r\n";
		}
	}
	WriteTextFile("config\\" + Addon_Id + ".tsv", data);
}
