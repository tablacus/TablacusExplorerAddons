var item = GetAddonElement("clipfolder");
if (!item.getAttribute("Set")) {
	item.setAttribute("Filter", "*.cfu");
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "Background");
	item.setAttribute("MenuPos", -1);

	item.setAttribute("KeyOn", "List");

	item.setAttribute("MouseOn", "List");
}

if (window.Addon == 1) {
	Addons.ClipFolder =
	{
		tid: [],

		FindItemIndex: function (FV, Item)
		{
			var Items = FV.Items();
			var path = String(api.GetDisplayNameOf(Item, SHGDN_FORPARSING | SHGDN_FORADDRESSBAR));
			for (var i = Items.Count; i-- > 0;) {
				if (path.toLowerCase() == String(api.GetDisplayNameOf(Items.Item(i), SHGDN_FORPARSING | SHGDN_FORADDRESSBAR)).toLowerCase()) {
					return i;
				}
			}
			return -1;
		},

		IsHandle: function (Ctrl)
		{
			return api.PathMatchSpec(typeof(Ctrl) == "string" ? Ctrl : api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING), Addons.ClipFolder.Spec);
		},

		Append: function (Ctrl, Items)
		{
			var db = {};
			var bSave = false;
			Addons.ClipFolder.Open(Ctrl, null, db);
			var arFV = Addons.ClipFolder.SyncFV(Ctrl);
			for (var j = 0; j < Items.Count; j++) {
				var Item = Items.Item(j);
				for (var i in arFV) {
					var nIndex = Addons.ClipFolder.FindItemIndex(arFV[i], Item);
					var Item1 = nIndex < 0 ? arFV[i].AddItem(Item) : arFV[i].Items.Item(nIndex);
					arFV[i].SelectItem(Item1, SVSI_SELECT | SVSI_FOCUSED | SVSI_ENSUREVISIBLE);
				}
				var path = Item.Path;
				if (!db[path]) {
					db[path] = 1;
					bSave = true;
				}
			}
			Addons.ClipFolder.Save(Ctrl, db);
		},

		Remove: function (Ctrl, pt)
		{
			if (!confirmOk("Are you sure?")) {
				return;
			}
			var ar = GetSelectedArray(Ctrl, pt, true);
			var Selected = ar[0];
			var arFV = Addons.ClipFolder.SyncFV(ar[2]);
			var db = {};
			var bSave = false;
			Addons.ClipFolder.Open(ar[2], null, db);
			for (var j = Selected.Count; j--;) {
				for (var i in arFV) {
					arFV[i].RemoveItem(Selected.Item(j));
				}
				var path = Selected.Item(j).Path;
				if (db[path]) {
					delete db[path];
					bSave = true;
				}
			}
			if (bSave) {
				Addons.ClipFolder.Save(ar[2], db);
			}
		},

		SyncFV: function (Ctrl)
		{
			var arFV = [];
			var path = Ctrl.FolderItem.Path;
			var cFV = te.Ctrls(CTRL_FV);
			for (var i in cFV) {
				if (path.toLowerCase() == cFV[i].FolderItem.Path.toLowerCase()) {
					arFV.push(cFV[i]);
				}
			}
			return arFV;
		},

		Open: function (Ctrl, ar, db)
		{
			var path = Ctrl.FolderItem.Path;
			var ado = te.CreateObject("Adodb.Stream");
			ado.CharSet = "utf-8";
			ado.Open();
			ado.LoadFromFile(path);
			var Items = [];
			while (!ado.EOS) {
				var s = ado.ReadText(adReadLine);
				if (s && !/^\s*#/.test(s)) {
					if (!/^[A-Z]:\\|^\\/i.test(s) && !/:/.test(s)) {
						s = fso.BuildPath(fso.GetParentFolderName(path), s);
					}
					if (ar) {
						ar.push(s);
					}
					if (db) {
						db[s] = 1;
					}
				}
			}
			ado.Close();
		},

		Save: function (Ctrl, db)
		{
			var path = Ctrl.FolderItem.Path;
			var ado = te.CreateObject("Adodb.Stream");
			ado.CharSet = "utf-8";
			ado.Open();
			for (var i in db) {
				ado.WriteText(i, adWriteLine);
			}
			ado.SaveToFile(path, adSaveCreateOverWrite);
			ado.Close();
		},

		Exec: function (Ctrl, pt)
		{
			var FV = GetFolderView(Ctrl, pt);
			var path = api.GetDisplayNameOf(FV, SHGDN_FORPARSING | SHGDN_FORADDRESSBAR);
			if (/^[A-Z]:\\|^\\/i.test(path)) {
				if (Addons.ClipFolder.IsHandle(path)) {
					var db = {};
					var Items = FV.Items();
					for (var i = 0; i < Items.Count; i++) {
						db[api.GetDisplayNameOf(Items.Item(i), SHGDN_FORPARSING | SHGDN_FORADDRESSBAR)] = 1;
					}
					Addons.ClipFolder.Save(FV, db);
				}
				else {
					var path2 = InputDialog(GetText("Create clip folder"), "");
					if (path2) {
						if (!/^[A-Z]:\\|^\\/i.test(path2)) {
							path2 = fso.BuildPath(path, path2.replace(/^\s+/, ""));
						}
						CreateFile(path2 + (fso.GetExtensionName(path2) || Addons.ClipFolder.Spec.replace(/[\*\?]|;.*$/g, "")));
					}
				}
			}
			return S_OK;
		},

		Command: function (Ctrl, Verb)
		{
			if (Ctrl && Ctrl.Type <= CTRL_EB && Addons.ClipFolder.IsHandle(Ctrl)) {
				switch (Verb + 1) {
					case CommandID_PASTE:
						Addons.ClipFolder.Append(Ctrl, api.OleGetClipboard());
						return S_OK;
					case CommandID_DELETE:
						Addons.ClipFolder.Remove(Ctrl);
						return S_OK;
				}
			}
		}
	};

	AddEvent("TranslatePath", function (Ctrl, Path)
	{
		if (Addons.ClipFolder.IsHandle(Path)) {
			return ssfRESULTSFOLDER;
		}
	}, true);

	AddEvent("NavigateComplete", function (Ctrl)
	{
		if (Addons.ClipFolder.IsHandle(Ctrl)) {
			if (Addons.ClipFolder.tid[Ctrl.Id]) {
				return;
			}
			Ctrl.SortColumn = "";
			Addons.ClipFolder.tid[Ctrl.Id] = setTimeout(function ()
			{
				delete Addons.ClipFolder.tid[Ctrl.Id];
				Ctrl.RemoveAll();
				var ar = [];
				Addons.ClipFolder.Open(Ctrl, ar);
				Ctrl.AddItems(ar, true);
			}, 99);
		}
	});

	AddEvent("DragEnter", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		if (Ctrl.Type <= CTRL_EB || Ctrl.Type == CTRL_DT) {
			if (Addons.ClipFolder.IsHandle(Ctrl)) {
				return S_OK;
			}
		}
	});

	AddEvent("DragOver", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		if (Ctrl.Type <= CTRL_EB) {
			if (Addons.ClipFolder.IsHandle(Ctrl)) {
				if (Ctrl.HitTest(pt, LVHT_ONITEM) < 0) {
					pdwEffect[0] = DROPEFFECT_LINK;
					return S_OK;
				}
			}
		}
		if (Ctrl.Type == CTRL_DT) {
			if (Addons.ClipFolder.IsHandle(Ctrl)) {
				pdwEffect[0] = DROPEFFECT_LINK;
				return S_OK;
			}
		}
	});

	AddEvent("Drop", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		if (Addons.ClipFolder.IsHandle(Ctrl)) {
			var nIndex = -1;
			if (Ctrl.Type <= CTRL_EB) {
				nIndex = Ctrl.HitTest(pt, LVHT_ONITEM);
			} else if (Ctrl.Type != CTRL_DT) {
				return S_OK;
			}
			if (nIndex < 0) {
				Addons.ClipFolder.Append(Ctrl, dataObj);
			}
			return S_OK;
		}
	});

	AddEvent("DragLeave", function (Ctrl)
	{
		return S_OK;
	});

	AddEvent("Command", function (Ctrl, hwnd, msg, wParam, lParam)
	{
		var hr = Addons.ClipFolder.Command(Ctrl, wParam & 0xfff);
		if (isFinite(hr)) {
			return hr;
		}
	}, true);

	AddEvent("InvokeCommand", function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon)
	{
		var hr = Addons.ClipFolder.Command(ContextMenu.FolderView, Verb);
		if (isFinite(hr)) {
			return hr;
		}
	}, true);

	AddEvent("DefaultCommand", function (Ctrl, Selected)
	{
		if (Selected.Count == 1) {
			var path = api.GetDisplayNameOf(Selected.Item(0), SHGDN_FORPARSING | SHGDN_FORADDRESSBAR);
			if (Addons.ClipFolder.IsHandle(path)) {
				Ctrl.Navigate(path);
				return S_OK;
			}
		}
	}, true);

	AddEvent("ILGetParent", function (FolderItem)
	{
		var path = FolderItem.Path;
		if (Addons.ClipFolder.IsHandle(path)) {
			return fso.GetParentFolderName(path);
		}
	});

	AddEvent("Context", function (Ctrl, hMenu, nPos, Selected, item, ContextMenu)
	{
		if (Addons.ClipFolder.IsHandle(Ctrl)) {
			RemoveCommand(hMenu, ContextMenu, "delete;rename");
			api.InsertMenu(hMenu, -1, MF_BYPOSITION | MF_STRING, ++nPos, api.LoadString(hShell32, 31368));
			ExtraMenuCommand[nPos] = OpenContains;
			api.InsertMenu(hMenu, -1, MF_BYPOSITION | MF_STRING, ++nPos, GetText('Remove'));
			ExtraMenuCommand[nPos] = Addons.ClipFolder.Remove;
		}
		return nPos;
	});

	AddEvent("Edit", function (Ctrl, hMenu, nPos, Selected, item)
	{
		if (Addons.ClipFolder.IsHandle(Ctrl)) {
			var Items = api.OleGetClipboard();
			if (Items && Items.Count) {
				for (var i = api.GetMenuItemCount(hMenu); i-- > 0;) {
					if (/Ctrl\+V/i.test(api.GetMenuString(hMenu, i, MF_BYPOSITION))) {
						api.EnableMenuItem(hMenu, i, MF_BYPOSITION | MF_ENABLED);
					}
				}
			}
		}
		return nPos;
	});

	Addons.ClipFolder.Spec = item.getAttribute("Filter") || "*.cfu";
	Addons.ClipFolder.strName = GetText(item.getAttribute("MenuName") || "Create clip folder...");
	Addons.ClipFolder.strName2 = GetText(item.getAttribute("MenuName2") || "Save clip folder");
	//Menu
	if (item.getAttribute("MenuExec")) {
		Addons.ClipFolder.nPos = api.LowPart(item.getAttribute("MenuPos"));
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos, Selected, item)
		{
			var path = api.GetDisplayNameOf(item, SHGDN_FORPARSING | SHGDN_FORADDRESSBAR);
			if (/^[A-Z]:\\|^\\/i.test(path)) {
				api.InsertMenu(hMenu, Addons.ClipFolder.nPos, MF_BYPOSITION | MF_STRING, ++nPos, api.PathMatchSpec(path, Addons.ClipFolder.Spec) ? Addons.ClipFolder.strName2 : Addons.ClipFolder.strName);
				ExtraMenuCommand[nPos] = Addons.ClipFolder.Exec;
			}
			return nPos;
		});
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.ClipFolder.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.ClipFolder.Exec, "Func");
	}

	AddTypeEx("Add-ons", "Create clip folder...", Addons.ClipFolder.Exec);
} else {
	SetTabContents(0, "General", '<label>Filter</label><input type="text" name="Filter" style="width: 100%" />');
	document.getElementById("panel7").insertAdjacentHTML("BeforeEnd", '<br /><label>Name</label>2<input type="text" name="MenuName2" style="width: 100%" />');
}
