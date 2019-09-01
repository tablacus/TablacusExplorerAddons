var Addon_Id = "enteredhistory";

var item = GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.EnteredHistory =
	{
		Items: item.getAttribute("Save") || 50,
		PATH: "entered:",
		CONFIG: fso.BuildPath(te.Data.DataFolder, "config\\enteredhistory.tsv"),
		bSave: false,
		Prev: null,
		strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
		nPos: api.LowPart(item.getAttribute("MenuPos")),

		IsHandle: function (Ctrl)
		{
			return api.PathMatchSpec(typeof(Ctrl) == "string" ? Ctrl : api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL), Addons.EnteredHistory.PATH + "*");
		},

		Enum: function (pid, Ctrl, fncb, SessionId)
		{
			var keys = [];
			Addons.EnteredHistory.GetList(keys);
			return keys;
		},

		GetList: function (keys)
		{
			for (var i in this.db) {
				keys.push(i);
			}
			keys.sort(function (a, b) {
				return Addons.EnteredHistory.db[b] - Addons.EnteredHistory.db[a];
			});
			while (keys.length > this.Items) {
				delete this.db[keys.pop()];
			}
		},

		Remove: function (Ctrl, pt)
		{
			if (!confirmOk()) {
				return;
			}
			var ar = GetSelectedArray(Ctrl, pt, true);
			var Selected = ar[0];
			for (var j = Selected.Count; j--;) {
				var item = Selected.Item(j);
				Ctrl.RemoveItem(item);
				var path = GetSavePath(item);
				if (Addons.EnteredHistory.db[path]) {
					delete Addons.EnteredHistory.db[path];
				} else {
					for (var i in Addons.EnteredHistory.db) {
						if (api.ILIsEqual(item, i)) {
							delete Addons.EnteredHistory.db[i];
							break;
						}
					}
				}
			}
		},
		Load: function ()
		{
			Addons.EnteredHistory.db = {};
			try {
				var ado = api.CreateObject("ads");
				ado.CharSet = "utf-8";
				ado.Open();
				ado.LoadFromFile(Addons.EnteredHistory.CONFIG);
				while (!ado.EOS) {
					var ar = ado.ReadText(adReadLine).split("\t");
					Addons.EnteredHistory.db[ar[0]] = ar[1];
				}
				ado.Close();
			} catch (e) {}
			Addons.EnteredHistory.ModifyDate = api.ILCreateFromPath(Addons.EnteredHistory.CONFIG).ModifyDate;
		},

		Save: function ()
		{
			if (Addons.EnteredHistory.tid) {
				clearTimeout(Addons.EnteredHistory.tid);
			}
			Addons.EnteredHistory.bSave = true;
			Addons.EnteredHistory.tid = setTimeout(Addons.EnteredHistory.SaveEx, 999);
		},

		SaveEx: function ()
		{
			if (Addons.EnteredHistory.bSave) {
				if (Addons.EnteredHistory.tid) {
					clearTimeout(Addons.EnteredHistory.tid);
					delete Addons.EnteredHistory.tid;
				}
				try {
					var ado = api.CreateObject("ads");
					ado.CharSet = "utf-8";
					ado.Open();
					var keys = [];
					Addons.EnteredHistory.GetList(keys);
					for (var i = 0; i < keys.length; i++) {
						ado.WriteText([keys[i], Addons.EnteredHistory.db[keys[i]]].join("\t") + "\r\n");
					}
					ado.SaveToFile(Addons.EnteredHistory.CONFIG, adSaveCreateOverWrite);
					ado.Close();
					Addons.EnteredHistory.bSave = false;
				} catch (e) {}
				Addons.EnteredHistory.ModifyDate = api.ILCreateFromPath(Addons.EnteredHistory.CONFIG).ModifyDate;			}
		}
	}
	Addons.EnteredHistory.Load();

	AddEvent("SaveConfig", Addons.EnteredHistory.SaveEx);

	AddEvent("ChangeNotifyItem:" + Addons.EnteredHistory.CONFIG, function (pid)
	{
		if (pid.ModifyDate - Addons.EnteredHistory.ModifyDate) {
			Addons.EnteredHistory.Load();
		}
	});

	AddEvent("LocationEntered", function (FV, Path, wFlags)
	{
		api.SHParseDisplayName(function (pid)
		{
		   if (pid) {
			   var path = GetSavePath(pid);
			   if (path && IsSavePath(path)) {
				   Addons.EnteredHistory.db[path] = new Date().getTime();
				   Addons.EnteredHistory.Save();
			   }
			}
	   }, 0, Path);
	});

	AddEvent("LocationPopup", function (hMenu)
	{
		var keys = [];
		Addons.EnteredHistory.GetList(keys);
		for (var i = 0; i < keys.length; i++) {
			FolderMenu.AddMenuItem(hMenu, api.ILCreateFromPath(keys[i]), /^[A-Z]:\\|^\\\\[A-Z]/i.test(keys[i]) ? keys[i]: "", true);
		}
		return S_OK;
	}, true);
	
	AddEvent("TranslatePath", function (Ctrl, Path)
	{
		if (Addons.EnteredHistory.IsHandle(Path)) {
			Ctrl.Enum = Addons.EnteredHistory.Enum;
			return ssfRESULTSFOLDER;
		}
	}, true);

	AddEvent("GetFolderItemName", function (pid)
	{
		if (Addons.EnteredHistory.IsHandle(pid)) {
			return Addons.EnteredHistory.strName;
		}
	}, true);

	AddEvent("GetIconImage", function (Ctrl, BGColor, bSimple)
	{
		if (Addons.EnteredHistory.IsHandle(Ctrl)) {
			return MakeImgDataEx("icon:shell32.dll,20", bSimple, 16);
		}
	});

	AddEvent("Context", function (Ctrl, hMenu, nPos, Selected, item, ContextMenu)
	{
		if (Addons.EnteredHistory.IsHandle(Ctrl)) {
			RemoveCommand(hMenu, ContextMenu, "delete;rename");
			api.InsertMenu(hMenu, -1, MF_BYPOSITION | MF_STRING, ++nPos, api.LoadString(hShell32, 31368));
			ExtraMenuCommand[nPos] = OpenContains;
			api.InsertMenu(hMenu, -1, MF_BYPOSITION | MF_STRING, ++nPos, GetText('Remove'));
			ExtraMenuCommand[nPos] = Addons.EnteredHistory.Remove;
		}
		return nPos;
	});

	AddEvent("Command", function (Ctrl, hwnd, msg, wParam, lParam)
	{
		if (Ctrl.Type == CTRL_SB || Ctrl.Type == CTRL_EB) {
			if (Addons.EnteredHistory.IsHandle(Ctrl)) {
				if ((wParam & 0xfff) == CommandID_DELETE - 1) {
					return S_OK;
				}
			}
		}
	});

	AddEvent("InvokeCommand", function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon)
	{
		if (Verb == CommandID_DELETE - 1) {
			var FV = ContextMenu.FolderView;
			if (FV && Addons.EnteredHistory.IsHandle(FV)) {
				return S_OK;
			}
		}
		if (!Verb || Verb == CommandID_STORE - 1) {
			if (ContextMenu.Items.Count >= 1) {
				var path = api.GetDisplayNameOf(ContextMenu.Items.Item(0), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL);
				if (Addons.EnteredHistory.IsHandle(path)) {
					var FV = te.Ctrl(CTRL_FV);
					FV.Navigate(path, SBSP_SAMEBROWSER);
					return S_OK;
				}
			}
		}
	});

	AddEvent("BeginLabelEdit", function (Ctrl, Name)
	{
		if (Ctrl.Type <= CTRL_EB) {
			if (Addons.EnteredHistory.IsHandle(Ctrl)) {
				return 1;
			}
		}
	}, true);
} else {
	SetTabContents(0, "", '<label>Number of items</label><br><input type="text" name="Save" size="4" placeholder="50">');
}
