var Addon_Id = "history";
var Default = "ToolBar2Left";

var item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("Menu", "File");
	item.setAttribute("MenuPos", -1);

	item.setAttribute("KeyExec", 1);
	item.setAttribute("KeyOn", "All");
	item.setAttribute("Key", "Ctrl+H");

	item.setAttribute("Save", 1000);
}
if (window.Addon == 1) {
	Addons.History1 =
	{
		Items: item.getAttribute("Save") || 1000,
		PATH: "history:",
		CONFIG: fso.BuildPath(te.Data.DataFolder, "config\\history.tsv"),
		bSave: false,
		Prev: null,
		strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
		nPos: api.LowPart(item.getAttribute("MenuPos")),

		IsHandle: function (Ctrl)
		{
			return api.PathMatchSpec(typeof(Ctrl) == "string" ? Ctrl : api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL), Addons.History1.PATH + "*");
		},

		Enum: function (pid, Ctrl, fncb, SessionId)
		{
			var keys = [];
			Addons.History1.GetList(keys);
			return keys;
		},

		GetList: function (keys)
		{
			for (var i in this.db) {
				keys.push(i);
			}
			keys.sort(function (a, b) {
				return Addons.History1.db[b] - Addons.History1.db[a];
			});
			while (keys.length > this.Items) {
				delete this.db[keys.pop()];
			}
		},

		Exec: function (Ctrl, pt)
		{
			var FV = GetFolderView(Ctrl, pt);
			FV.Focus();
			var TC = FV.Parent;
			for (var i in TC) {
				if (Addons.History1.IsHandle(TC[i])) {
					TC.SelectedIndex = i;
					TC[i].Refresh();
					return S_OK;
				}
			}
			FV.Navigate(Addons.History1.PATH, SBSP_NEWBROWSER);
			return S_OK;
		},

		Popup: function ()
		{
			return false;
		},

		Remove: function (Ctrl, pt)
		{
			if (!confirmOk("Are you sure?")) {
				return;
			}
			var ar = GetSelectedArray(Ctrl, pt, true);
			var Selected = ar[0];
			for (var j = Selected.Count; j--;) {
				var item = Selected.Item(j);
				Ctrl.RemoveItem(item);
				var path = GetSavePath(item);
				if (Addons.History1.db[path]) {
					delete Addons.History1.db[path];
				} else {
					for (var i in Addons.History1.db) {
						if (api.ILIsEqual(item, i)) {
							delete Addons.History1.db[i];
							break;
						}
					}
				}
			}
		},
		Load: function ()
		{
			Addons.History1.db = {};
			try {
				var ado = api.CreateObject("ads");
				ado.CharSet = "utf-8";
				ado.Open();
				ado.LoadFromFile(Addons.History1.CONFIG);
				while (!ado.EOS) {
					var ar = ado.ReadText(adReadLine).split("\t");
					Addons.History1.db[ar[0]] = ar[1];
				}
				ado.Close();
			} catch (e) {}
			Addons.History1.ModifyDate = api.ILCreateFromPath(Addons.History1.CONFIG).ModifyDate;
		},

		Save: function ()
		{
			if (Addons.History1.tid) {
				clearTimeout(Addons.History1.tid);
			}
			Addons.History1.bSave = true;
			Addons.History1.tid = setTimeout(Addons.History1.SaveEx, 999);
		},

		SaveEx: function ()
		{
			if (Addons.History1.bSave) {
				if (Addons.History1.tid) {
					clearTimeout(Addons.History1.tid);
					delete Addons.History1.tid;
				}
				try {
					var ado = api.CreateObject("ads");
					ado.CharSet = "utf-8";
					ado.Open();
					var keys = [];
					Addons.History1.GetList(keys);
					for (var i = 0; i < keys.length; i++) {
						ado.WriteText([keys[i], Addons.History1.db[keys[i]]].join("\t") + "\r\n");
					}
					ado.SaveToFile(Addons.History1.CONFIG, adSaveCreateOverWrite);
					ado.Close();
					Addons.History1.bSave = false;
				} catch (e) {}
				Addons.History1.ModifyDate = api.ILCreateFromPath(Addons.History1.CONFIG).ModifyDate;			}
		}
	}
	Addons.History1.Load();

	AddEvent("SaveConfig", Addons.History1.SaveEx);

	AddEvent("ChangeNotifyItem:" + Addons.History1.CONFIG, function (pid)
	{
		if (pid.ModifyDate - Addons.History1.ModifyDate) {
			Addons.History1.Load();
		}
	});

	AddEvent("NavigateComplete", function (Ctrl)
	{
		if (!Addons.History1.IsHandle(Ctrl)) {
			var path = GetSavePath(Ctrl.FolderItem);
			if (path && IsSavePath(path)) {
				Addons.History1.db[path] = new Date().getTime();
				Addons.History1.Save();
			}
		}
	});

	AddEvent("TranslatePath", function (Ctrl, Path)
	{
		if (Addons.History1.IsHandle(Path)) {
			Ctrl.Enum = Addons.History1.Enum;
			return ssfRESULTSFOLDER;
		}
	}, true);

	AddEvent("GetFolderItemName", function (pid)
	{
		if (Addons.History1.IsHandle(pid)) {
			return Addons.History1.strName;
		}
	}, true);

	AddEvent("GetIconImage", function (Ctrl, BGColor, bSimple)
	{
		if (Addons.History1.IsHandle(Ctrl)) {
			return MakeImgDataEx("icon:shell32.dll,20", bSimple, 16);
		}
	});

	AddEvent("Context", function (Ctrl, hMenu, nPos, Selected, item, ContextMenu)
	{
		if (Addons.History1.IsHandle(Ctrl)) {
			RemoveCommand(hMenu, ContextMenu, "delete;rename");
			api.InsertMenu(hMenu, -1, MF_BYPOSITION | MF_STRING, ++nPos, api.LoadString(hShell32, 31368));
			ExtraMenuCommand[nPos] = OpenContains;
			api.InsertMenu(hMenu, -1, MF_BYPOSITION | MF_STRING, ++nPos, GetText('Remove'));
			ExtraMenuCommand[nPos] = Addons.History1.Remove;
		}
		return nPos;
	});

	AddEvent("Command", function (Ctrl, hwnd, msg, wParam, lParam)
	{
		if (Ctrl.Type == CTRL_SB || Ctrl.Type == CTRL_EB) {
			if (Addons.History1.IsHandle(Ctrl)) {
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
			if (FV && Addons.History1.IsHandle(FV)) {
				return S_OK;
			}
		}
		if (!Verb || Verb == CommandID_STORE - 1) {
			if (ContextMenu.Items.Count >= 1) {
				var path = api.GetDisplayNameOf(ContextMenu.Items.Item(0), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL);
				if (Addons.History1.IsHandle(path)) {
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
			if (Addons.History1.IsHandle(Ctrl)) {
				return 1;
			}
		}
	}, true);

	//Menu
	if (item.getAttribute("MenuExec")) {
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
		{
			api.InsertMenu(hMenu, Addons.History1.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Addons.History1.strName));
			ExtraMenuCommand[nPos] = Addons.History1.Exec;
			return nPos;
		});
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.History1.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.History1.Exec, "Func");
	}
	AddTypeEx("Add-ons", "History", Addons.History1.Exec);

	var h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	var s = item.getAttribute("Icon") || (h <= 16 ? "bitmap:ieframe.dll,206,16,12" : "bitmap:ieframe.dll,204,24,12");
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.History1.Exec(this);" oncontextmenu="Addons.History1.Popup(); return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', GetImgTag({ title: Addons.History1.strName, src: s}, h), '</span>']);
} else {
	EnableInner();
	SetTabContents(0, "General", '<label>Number of items</label><br><input type="text" name="Save" size="4">');
}
