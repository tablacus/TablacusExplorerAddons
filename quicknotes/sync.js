Sync.QuickNotes = {
	Exec: function (Ctrl, pt) {
		let Items = Sync.QuickNotes.Items;
		if (!Items) {
			Items = [];
			const lines = ReadTextFile(BuildPath(te.Data.DataFolder, "config\\quicknotes.tsv")).split(/\r?\n/);
			for (let line; line = lines.shift();) {
				const ar = line.split("\t");
				if (ar[0] != "") {
					Items.push(ar);
				}
			}
			Sync.QuickNotes.Items = Items;
		}
		const hMenu = api.CreatePopupMenu();
		for (let i = 0; i < Items.length; ++i) {
			const ar = Items[i];
			api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, i + 9, ar[0] + "\t" + GetKeyName(ar[2]));
		}
		if (!Items.length || Sync.QuickNotes.bEdit) {
			if (Items.length) {
				api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_SEPARATOR, 0, null);
			}
			api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, 1, GetText("Edit"));
			Sync.QuickNotes.bEdit = false;
		}
		if (!pt) {
			pt = api.GetCursorPos();
		}
		const nVerb = api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null, null);
		if (nVerb) {
			switch (nVerb) {
				case 1:
					InvokeUI("AddonOptions", ["quicknotes", function () {
						Sync.QuickNotes.Items = null;
					}]);
					break;
				default:
					const ar = Items[nVerb - 9];
					if (ar[1] == "Tree") {
						Ctrl = te.Ctrl(CTRL_TV);
					} else if (ar[1] == "List") {
						Ctrl = te.Ctrl(CTRL_FV);
					} else {
						Ctrl = te;
					}
					KeyExec(Ctrl, ar[1], ar[2], Ctrl.hwnd);
					break;
			}
		}
		api.DestroyMenu(hMenu);
		return S_OK;
	},

	Popup: function () {
		Sync.QuickNotes.bEdit = true;
		Sync.QuickNotes.Exec();
	}
};

