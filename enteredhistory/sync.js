const Addon_Id = "enteredhistory";
const item = GetAddonElement(Addon_Id);

Sync.EnteredHistory = {
	Items: item.getAttribute("Save") || 50,
	PATH: "entered:",
	CONFIG: BuildPath(te.Data.DataFolder, "config\\enteredhistory.tsv"),
	bSave: false,
	Prev: null,
	sName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
	nPos: GetNum(item.getAttribute("MenuPos")),

	IsHandle: function (Ctrl) {
		return new RegExp("^" + Sync.EnteredHistory.PATH, "").test("string" === typeof Ctrl ? Ctrl : api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING));
	},

	Enum: function (pid, Ctrl, fncb, SessionId) {
		const keys = [];
		Sync.EnteredHistory.GetList(keys);
		return keys;
	},

	GetList: function (keys) {
		for (let i in this.db) {
			keys.push(i);
		}
		keys.sort(function (a, b) {
			return Sync.EnteredHistory.db[b] - Sync.EnteredHistory.db[a];
		});
		while (keys.length > this.Items) {
			delete this.db[keys.pop()];
		}
	},

	Remove: function (Ctrl, pt) {
		if (!confirmOk()) {
			return;
		}
		const ar = GetSelectedArray(Ctrl, pt, true);
		const Selected = ar[0];
		for (let j = Selected.Count; j--;) {
			const item = Selected.Item(j);
			Ctrl.RemoveItem(item);
			const path = GetSavePath(item);
			if (Sync.EnteredHistory.db[path]) {
				delete Sync.EnteredHistory.db[path];
			} else {
				for (let i in Sync.EnteredHistory.db) {
					if (api.ILIsEqual(item, i)) {
						delete Sync.EnteredHistory.db[i];
						break;
					}
				}
			}
		}
	},

	Load: function () {
		Sync.EnteredHistory.db = {};
		try {
			const ado = api.CreateObject("ads");
			ado.CharSet = "utf-8";
			ado.Open();
			ado.LoadFromFile(Sync.EnteredHistory.CONFIG);
			while (!ado.EOS) {
				const ar = ado.ReadText(adReadLine).split("\t");
				Sync.EnteredHistory.db[ar[0]] = ar[1];
			}
			ado.Close();
		} catch (e) { }
		Sync.EnteredHistory.ModifyDate = api.ILCreateFromPath(Sync.EnteredHistory.CONFIG).ModifyDate;
	},

	Save: function () {
		if (Sync.EnteredHistory.tid) {
			clearTimeout(Sync.EnteredHistory.tid);
		}
		Sync.EnteredHistory.bSave = true;
		Sync.EnteredHistory.tid = setTimeout(Sync.EnteredHistory.SaveEx, 999);
	},

	SaveEx: function () {
		if (Sync.EnteredHistory.bSave) {
			if (Sync.EnteredHistory.tid) {
				clearTimeout(Sync.EnteredHistory.tid);
				delete Sync.EnteredHistory.tid;
			}
			try {
				const ado = api.CreateObject("ads");
				ado.CharSet = "utf-8";
				ado.Open();
				const keys = [];
				Sync.EnteredHistory.GetList(keys);
				for (let i = 0; i < keys.length; i++) {
					ado.WriteText([keys[i], Sync.EnteredHistory.db[keys[i]]].join("\t") + "\r\n");
				}
				ado.SaveToFile(Sync.EnteredHistory.CONFIG, adSaveCreateOverWrite);
				ado.Close();
				Sync.EnteredHistory.bSave = false;
			} catch (e) { }
			Sync.EnteredHistory.ModifyDate = api.ILCreateFromPath(Sync.EnteredHistory.CONFIG).ModifyDate;
		}
	}
}
Sync.EnteredHistory.Load();

AddEvent("SaveConfig", Sync.EnteredHistory.SaveEx);

AddEvent("ChangeNotifyItem:" + Sync.EnteredHistory.CONFIG, function (pid) {
	if (pid.ModifyDate - Sync.EnteredHistory.ModifyDate) {
		Sync.EnteredHistory.Load();
	}
});

AddEvent("LocationEntered", function (FV, Path, wFlags) {
	api.SHParseDisplayName(function (pid) {
		if (pid) {
			const path = GetSavePath(pid);
			if (path && IsSavePath(path)) {
				Sync.EnteredHistory.db[path] = new Date().getTime();
				Sync.EnteredHistory.Save();
			}
		}
	}, 0, Path);
});

AddEvent("LocationPopup", function (hMenu) {
	const keys = [];
	Sync.EnteredHistory.GetList(keys);
	for (let i = 0; i < keys.length; i++) {
		FolderMenu.AddMenuItem(hMenu, api.ILCreateFromPath(keys[i]), /^[A-Z]:\\|^\\\\[A-Z]/i.test(keys[i]) ? keys[i] : "", true);
	}
	return S_OK;
}, true);

AddEvent("TranslatePath", function (Ctrl, Path) {
	if (Sync.EnteredHistory.IsHandle(Path)) {
		Ctrl.Enum = Sync.EnteredHistory.Enum;
		return ssfRESULTSFOLDER;
	}
}, true);

AddEvent("GetFolderItemName", function (pid) {
	if (Sync.EnteredHistory.IsHandle(pid)) {
		return Sync.EnteredHistory.sName;
	}
}, true);

AddEvent("GetIconImage", function (Ctrl, clBk, bSimple) {
	if (Sync.EnteredHistory.IsHandle(Ctrl)) {
		return MakeImgDataEx("icon:shell32.dll,20", bSimple, 16, clBk);
	}
});

AddEvent("Context", function (Ctrl, hMenu, nPos, Selected, item, ContextMenu) {
	if (Sync.EnteredHistory.IsHandle(Ctrl)) {
		RemoveCommand(hMenu, ContextMenu, "delete;rename");
		api.InsertMenu(hMenu, -1, MF_BYPOSITION | MF_STRING, ++nPos, api.LoadString(hShell32, 31368));
		ExtraMenuCommand[nPos] = OpenContains;
		api.InsertMenu(hMenu, -1, MF_BYPOSITION | MF_STRING, ++nPos, GetText('Remove'));
		ExtraMenuCommand[nPos] = Sync.EnteredHistory.Remove;
	}
	return nPos;
});

AddEvent("Command", function (Ctrl, hwnd, msg, wParam, lParam) {
	if (Ctrl.Type == CTRL_SB || Ctrl.Type == CTRL_EB) {
		if ((wParam & 0xfff) == CommandID_DELETE - 1) {
			if (Sync.EnteredHistory.IsHandle(Ctrl)) {
				Sync.EnteredHistory.Remove(Ctrl);
				return S_OK;
			}
		}
	}
}, true);

AddEvent("InvokeCommand", function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon) {
	if (Verb == CommandID_DELETE - 1) {
		const FV = ContextMenu.FolderView;
		if (FV && Sync.EnteredHistory.IsHandle(FV)) {
			Sync.EnteredHistory.Remove(FV);
			return S_OK;
		}
	}
	if (!Verb || Verb == CommandID_STORE - 1) {
		if (ContextMenu.Items.Count >= 1) {
			const path = ContextMenu.Items.Item(0).Path;
			if (Sync.EnteredHistory.IsHandle(path)) {
				const FV = te.Ctrl(CTRL_FV);
				FV.Navigate(path, SBSP_SAMEBROWSER);
				return S_OK;
			}
		}
	}
}, true);

AddEvent("BeginLabelEdit", function (Ctrl, Name) {
	if (Ctrl.Type <= CTRL_EB) {
		if (Sync.EnteredHistory.IsHandle(Ctrl)) {
			return 1;
		}
	}
}, true);
