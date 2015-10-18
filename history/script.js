Addon_Id = "history";
Default = "ToolBar2Left";

var items = te.Data.Addons.getElementsByTagName(Addon_Id);
if (items.length) {
	var item = items[0];
	if (!item.getAttribute("Set")) {
		item.setAttribute("Menu", "File");
		item.setAttribute("MenuPos", -1);

		item.setAttribute("KeyExec", 1);
		item.setAttribute("KeyOn", "All");
		item.setAttribute("Key", "Ctrl+H");

		item.setAttribute("Save", 1000);
	}
}
if (window.Addon == 1) {
	Addons.History1 =
	{
		SAVE: 1000,
		PATH: "history:",
		CONFIG: fso.BuildPath(te.Data.DataFolder, "config\\history.tsv"),
		db: {},
		bSave: false,
		Prev: null,
		strName: "",

		IsHandle: function (Ctrl)
		{
			return api.PathMatchSpec(typeof(Ctrl) == "string" ? Ctrl : api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING), Addons.History1.PATH + "*");
		},

		GetList: function (keys)
		{
			for (var i in this.db) {
				keys.push(i);
			}
			keys.sort(function (a, b) {
				return Addons.History1.db[b] - Addons.History1.db[a];
			});
			while (keys.length > this.SAVE) {
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
				var path = api.GetDisplayNameOf(item, SHGDN_FORPARSING | SHGDN_FORADDRESSBAR);
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
	}
	try {
		var ado = te.CreateObject("Adodb.Stream");
		ado.CharSet = "utf-8";
		ado.Open();
		ado.LoadFromFile(Addons.History1.CONFIG);
		while (!ado.EOS) {
			var ar = ado.ReadText(adReadLine).split("\t");
			Addons.History1.db[ar[0]] = ar[1];
		}
		ado.Close();
	} catch (e) {}

	AddEvent("SaveConfig", function ()
	{
		if (Addons.History1.bSave) {
			try {
				var ado = te.CreateObject("Adodb.Stream");
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
		}
	});

	AddEvent("ListViewCreated", function (Ctrl)
	{
		if (Addons.History1.IsHandle(Ctrl)) {
			setTimeout(function () {
				var keys = [];
				Addons.History1.GetList(keys);
				var Items = Ctrl.Items();
				for (var i = Items.Count; i--;) {
					Ctrl.RemoveItem(Items.Item(i));
				}
				for (var i = 0; i < keys.length; i++) {
					Ctrl.AddItem(keys[i]);
				}
			}, 99);
		} else {
			var path = api.GetDisplayNameOf(Ctrl.FolderItem, SHGDN_FORPARSING | SHGDN_FORADDRESSBAR);
			if (path != "" && IsSavePath(path)) {
				Addons.History1.db[path] = new Date().getTime();
				Addons.History1.bSave = true;
			}
		}
	});

	AddEvent("TranslatePath", function (Ctrl, Path)
	{
		if (Addons.History1.IsHandle(Path)) {
			return ssfRESULTSFOLDER;
		}
	}, true);

	AddEvent("GetTabName", function (Ctrl)
	{
		if (Addons.History1.IsHandle(Ctrl)) {
			return Addons.History1.strName;
		}
	}, true);

	AddEvent("Context", function (Ctrl, hMenu, nPos, Selected, item, ContextMenu)
	{
		if (Addons.History1.IsHandle(Ctrl)) {
			RemoveCommand(hMenu, ContextMenu, "delete;rename");
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
		if (!Verb) {
			if (ContextMenu.Items.Count >= 1) {
				var path = api.GetDisplayNameOf(ContextMenu.Items.Item(0), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
				if (Addons.History1.IsHandle(path)) {
					var FV = te.Ctrl(CTRL_FV);
					FV.Navigate(path, SBSP_SAMEBROWSER);
					return S_OK;
				}
			}
		}
	});

	if (items.length) {
		Addons.History1.Save = item.getAttribute("Save") || Addons.History1.Save;
		//Menu
		if (item.getAttribute("MenuExec")) {
			Addons.History1.nPos = api.LowPart(item.getAttribute("MenuPos"));
			Addons.History1.strName = item.getAttribute("MenuName") || "History";

			AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
			{
				api.InsertMenu(hMenu, Addons.History1.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Addons.History1.strName));
				ExtraMenuCommand[nPos] = Addons.History1.Exec;
				return nPos;
			});
		}
		if (!Addons.History1.strName) {
			var info = GetAddonInfo(Addon_Id);
			Addons.History1.strName = info.Name;
		}
		//Key
		if (item.getAttribute("KeyExec")) {
			SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.History1.Exec, "Func");
		}
		//Mouse
		if (item.getAttribute("MouseExec")) {
			SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.History1.Exec, "Func");
		}
		AddTypeEx("Add-ons", "Reset Columns", Addons.History1.Exec);
	}

	var h = GetAddonOption(Addon_Id, "IconSize") || window.IconSize || 24;
	var s = GetAddonOption(Addon_Id, "Icon") || (h <= 16 ? "bitmap:ieframe.dll,206,16,12" : "bitmap:ieframe.dll,204,24,12");
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.History1.Exec(this);" oncontextmenu="Addons.History1.Popup(); return false;" onmouseover="MouseOver(this)" onmouseout="MouseOut()"><img title="', Addons.History1.strName, '" src="' + s.replace(/"/g, "") + '" width="', h, 'px" height="', h, 'px" /></span>']);
} else {
	EnableInner();
	document.getElementById("tab0").value = GetText("General");
	document.getElementById("panel0").innerHTML = ['<label>Folders</label><br /><input type="text" name="Save" size="4" />'].join("");
}

