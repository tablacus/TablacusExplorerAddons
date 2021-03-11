const Addon_Id = "labelgroups";

if (window.Addon == 1) {
	AddEvent("Load", async function () {
		(Common.Label || {}).Groups = await CreateSync("SimpleDB", Addon_Id, true);
	});
} else {
	g_nLast = 0;
	SetTabContents(4, "General", '<form name="E" id="data1"></form>');
	AddGroup = function (strPath, strLabel) {
		s = ['<table style="width: 100%"><tr><td><input type="text" name="p', g_nLast, '" value="', strPath, '" style="width: 10em" onchange="FilterChanged(this)" placeholder="Name" title="Name"></td>'];
		s.push('<td style="width: 100%"><input type="text" name="c', g_nLast, '" value="', strLabel, '"  style="width: 100%" placeholder="Label" title="Label" onchange="FilterChanged()" ></td>');
		s.push('<td style="width: 1em"><input type="button" name="b', g_nLast, '" value="..."  onclick="AddLabel(this)" title="Browse"></td>');
		s.push('</tr></table>');
		const o = document.getElementById("data1");
		o.insertAdjacentHTML("BeforeEnd", s.join(""));
		ApplyLang(o);
		g_nLast++;
	}

	FilterChanged = function (o) {
		g_bChanged = true;
		if (o && o.name.replace(/\D/, "") == g_nLast - 1) {
			AddGroup("", "");
		}
	}

	AddLabel = async function (o) {
		const Label = await MainWindow.Sync.Label;
		if (Label) {
			const oc = document.E.elements["c" + o.name.replace(/\D/, "")];
			const hMenu = await api.CreatePopupMenu();
			const oList = await api.CreateObject("Object");
			await Label.List(oList);
			let nPos = 0;
			for (let list = await api.CreateObject("Enum", oList); !await list.atEnd(); await list.moveNext()) {
				api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, ++nPos, await list.item());
			}
			const pt = GetPosEx(o, 9);
			const nVerb = await api.TrackPopupMenuEx(hMenu, TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, ui_.hwnd, null, null);
			if (nVerb) {
				const ar = oc.value.split(/\s*;\s/);
				ar.push(await api.GetMenuString(hMenu, nVerb, MF_BYCOMMAND));
				for (let i = ar.length; i--;) {
					if (ar[i] == "") {
						ar.splice(i, 1);
					}
				}
				oc.value = ar.join(";");
			}
			api.DestroyMenu(hMenu);
		}
	}

	SaveLocation = async function () {
		const db = await CreateSync("SimpleDB", Addon_Id);
		for (let i = 0; i < g_nLast; i++) {
			const s = document.E.elements['p' + i].value;
			if (s != "") {
				await db.Set(s, document.E.elements['c' + i].value);
			}
		}
		db.Save();
	}

	const db = await CreateSync("SimpleDB", Addon_Id, true);
	await db.ENumCB(AddGroup);
	AddGroup("", "");
}
