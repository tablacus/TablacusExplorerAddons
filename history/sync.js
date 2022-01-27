const Addon_Id = "history";
const item = GetAddonElement(Addon_Id);

Sync.History1 = {
	Items: item.getAttribute("Save") || 1000,
	PATH: "history:",
	CONFIG: BuildPath(te.Data.DataFolder, "config\\history.tsv"),
	bSave: false,
	Prev: null,
	sName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
	nPos: GetNum(item.getAttribute("MenuPos")),

	IsHandle: function (Ctrl) {
		return new RegExp("^" + Sync.History1.PATH, "").test("string" === typeof Ctrl ? Ctrl : api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING));
	},

	Enum: function (pid, Ctrl, fncb, SessionId) {
		const keys = [];
		Sync.History1.GetList(keys);
		return keys;
	},

	GetList: function (keys) {
		for (let i in this.db) {
			keys.push(i);
		}
		keys.sort(function (a, b) {
			return Sync.History1.db[b] - Sync.History1.db[a];
		});
		while (keys.length > this.Items) {
			delete this.db[keys.pop()];
		}
	},

	Exec: function (Ctrl, pt) {
		const FV = GetFolderView(Ctrl, pt);
		FV.Focus();
		const TC = FV.Parent;
		for (let i in TC) {
			if (Sync.History1.IsHandle(TC[i])) {
				TC.SelectedIndex = i;
				TC[i].Refresh();
				return S_OK;
			}
		}
		FV.Navigate(Sync.History1.PATH, SBSP_NEWBROWSER);
		return S_OK;
	},

	Remove: function (Ctrl, pt) {
		if (!confirmOk()) {
			return;
		}
		const ar = GetSelectedArray(Ctrl, pt, true);
		const Selected = ar[0];
		const FV = ar[2];
		for (let j = Selected.Count; j--;) {
			const item = Selected.Item(j);
			FV.RemoveItem(item);
			const path = GetSavePath(item);
			if (Sync.History1.db[path]) {
				delete Sync.History1.db[path];
			} else {
				for (let i in Sync.History1.db) {
					if (api.ILIsEqual(item, i)) {
						delete Sync.History1.db[i];
						break;
					}
				}
			}
		}
	},

	Load: function () {
		Sync.History1.db = {};
		try {
			const ado = api.CreateObject("ads");
			ado.CharSet = "utf-8";
			ado.Open();
			ado.LoadFromFile(Sync.History1.CONFIG);
			while (!ado.EOS) {
				const ar = ado.ReadText(adReadLine).split("\t");
				Sync.History1.db[ar[0]] = ar[1];
			}
			ado.Close();
		} catch (e) { }
		Sync.History1.ModifyDate = api.ILCreateFromPath(Sync.History1.CONFIG).ModifyDate;
	},

	Save: function () {
		if (Sync.History1.tid) {
			clearTimeout(Sync.History1.tid);
		}
		Sync.History1.bSave = true;
		Sync.History1.tid = setTimeout(Sync.History1.SaveEx, 999);
	},

	SaveEx: function () {
		if (Sync.History1.bSave) {
			if (Sync.History1.tid) {
				clearTimeout(Sync.History1.tid);
				delete Sync.History1.tid;
			}
			try {
				const ado = api.CreateObject("ads");
				ado.CharSet = "utf-8";
				ado.Open();
				const keys = [];
				Sync.History1.GetList(keys);
				for (let i = 0; i < keys.length; i++) {
					ado.WriteText([keys[i], Sync.History1.db[keys[i]]].join("\t") + "\r\n");
				}
				ado.SaveToFile(Sync.History1.CONFIG, adSaveCreateOverWrite);
				ado.Close();
				Sync.History1.bSave = false;
			} catch (e) { }
			Sync.History1.ModifyDate = api.ILCreateFromPath(Sync.History1.CONFIG).ModifyDate;
		}
	},

	ProcessMenu: function (Ctrl, hMenu, nPos, Selected, item, ContextMenu) {
		const FV = GetFolderView(Ctrl);
		if (Sync.History1.IsHandle(FV)) {
			RemoveCommand(hMenu, ContextMenu, "delete;rename");
			api.InsertMenu(hMenu, -1, MF_BYPOSITION | MF_STRING, ++nPos, GetTextR("@shell32.dll,-31368"));
			ExtraMenuCommand[nPos] = OpenContains;
			api.InsertMenu(hMenu, -1, MF_BYPOSITION | MF_STRING, ++nPos, GetText('Remove'));
			ExtraMenuCommand[nPos] = Sync.History1.Remove;
		}
		return nPos;
	}
}
Sync.History1.Load();

AddEvent("SaveConfig", Sync.History1.SaveEx);

AddEvent("ChangeNotifyItem:" + Sync.History1.CONFIG, function (pid) {
	if (pid.ModifyDate - Sync.History1.ModifyDate) {
		Sync.History1.Load();
	}
});

AddEvent("NavigateComplete", function (Ctrl) {
	if (!Sync.History1.IsHandle(Ctrl)) {
		const path = GetSavePath(Ctrl.FolderItem);
		if (path && IsSavePath(path)) {
			Sync.History1.db[path] = new Date().getTime();
			Sync.History1.Save();
		}
	}
});

AddEvent("TranslatePath", function (Ctrl, Path) {
	if (Sync.History1.IsHandle(Path)) {
		Ctrl.Enum = Sync.History1.Enum;
		return ssfRESULTSFOLDER;
	}
}, true);

AddEvent("GetFolderItemName", function (pid) {
	if (Sync.History1.IsHandle(pid)) {
		return Sync.History1.sName;
	}
}, true);

AddEvent("GetIconImage", function (Ctrl, clBk, bSimple) {
	if (Sync.History1.IsHandle(Ctrl)) {
		return MakeImgDataEx("icon:shell32.dll,20", bSimple, 16, clBk);
	}
});

AddEvent("Context", Sync.History1.ProcessMenu);

AddEvent("File", Sync.History1.ProcessMenu);

AddEvent("Command", function (Ctrl, hwnd, msg, wParam, lParam) {
	if (Ctrl.Type == CTRL_SB || Ctrl.Type == CTRL_EB) {
		if ((wParam & 0xfff) == CommandID_DELETE - 1) {
			if (Sync.History1.IsHandle(Ctrl)) {
				Sync.History1.Remove(Ctrl);
				return S_OK;
			}
		}
	}
}, true);

AddEvent("InvokeCommand", function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon) {
	if (Verb == CommandID_DELETE - 1) {
		const FV = ContextMenu.FolderView;
		if (FV && Sync.History1.IsHandle(FV)) {
			Sync.History1.Remove(FV);
			return S_OK;
		}
	}
	if (!Verb || Verb == CommandID_STORE - 1) {
		if (ContextMenu.Items.Count >= 1) {
			const path = ContextMenu.Items.Item(0).Path;
			if (Sync.History1.IsHandle(path)) {
				const FV = te.Ctrl(CTRL_FV);
				FV.Navigate(path, SBSP_SAMEBROWSER);
				return S_OK;
			}
		}
	}
}, true);

AddEvent("BeginLabelEdit", function (Ctrl, Name) {
	if (Ctrl.Type <= CTRL_EB) {
		if (Sync.History1.IsHandle(Ctrl)) {
			return 1;
		}
	}
}, true);

//Menu
if (item.getAttribute("MenuExec")) {
	AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos) {
		api.InsertMenu(hMenu, Sync.History1.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Sync.History1.sName);
		ExtraMenuCommand[nPos] = Sync.History1.Exec;
		return nPos;
	});
}
//Key
if (item.getAttribute("KeyExec")) {
	SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Sync.History1.Exec, "Func");
}
//Mouse
if (item.getAttribute("MouseExec")) {
	SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Sync.History1.Exec, "Func");
}
AddTypeEx("Add-ons", "History", Sync.History1.Exec);
