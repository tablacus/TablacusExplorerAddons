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
		FindItemIndex: function (FV, Item)
		{
			var Items = FV.Items();
			var path = String(api.GetDisplayNameOf(Item, SHGDN_FORPARSING | SHGDN_FORADDRESSBAR | SHGDN_ORIGINAL));
			for (var i = Items.Count; i-- > 0;) {
				if (path.toLowerCase() == String(api.GetDisplayNameOf(Items.Item(i), SHGDN_FORPARSING | SHGDN_FORADDRESSBAR | SHGDN_ORIGINAL)).toLowerCase()) {
					return i;
				}
			}
			return -1;
		},

		IsHandle: function (Ctrl)
		{
			var path = Addons.ClipFolder.GetPath(Ctrl);
			return /^[A-Z]:\\|^\\\\/i.test(path) && api.PathMatchSpec(path, Addons.ClipFolder.Spec) && fso.FileExists(path);
		},

		GetPath: function (Ctrl)
		{
			return /string/i.test(typeof Ctrl) ? api.PathUnquoteSpaces(ExtractMacro(te, Ctrl)) : api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
		},

		Enum: function (pid, Ctrl, fncb, SessionId)
		{
			var Items = te.FolderItems();
			Addons.ClipFolder.Open(pid, Items);
			return Items;
		},

		Add: function (Ctrl, Items)
		{
			if (/string/i.test(typeof Items)) {
				var arg = api.CommandLineToArgv(api.PathUnquoteSpaces(ExtractMacro(te, Items)));
				Items = te.FolderItems();
				for (var i in arg) {
					if (arg[i]) {
						Items.AddItem(arg[i]);
					}
				}
			}
			if (Items.Count == 0 || !Addons.ClipFolder.IsHandle(Ctrl)) {
				return;
			}
			var db = {};
			Addons.ClipFolder.Open(Ctrl, null, db);

			var AddItems = te.FolderItems();
			for (var j = 0; j < Items.Count; j++) {
				var Item = Items.Item(j);
				var path = Item.Path;
				if (!db[path]) {
					db[path] = 1;
					AddItems.AddItem(Item);
				}
			}
			if (AddItems.Count) {
				Addons.ClipFolder.Save(Ctrl, db);
				var arFV = Addons.ClipFolder.SyncFV(Ctrl);
				for (var i in arFV) {
					arFV[i].AddItems(AddItems, true, function (FV, Items, ProgressDialog)
					{
						FV.SelectItem(null, SVSI_DESELECTOTHERS);
						var FVItems = FV.Items;
						if (Items.Count < 9) {
							for (var k = 0; k < Items.Count; k++) {
								var l = Addons.ClipFolder.FindItemIndex(FV, Items.Item(k));
								if (l >= 0) {
									FV.SelectItem(FVItems.Item(l), SVSI_SELECT | SVSI_FOCUSED | SVSI_ENSUREVISIBLE);
								}
							}
						}
					});
				}
			}
		},

		Remove: function (Ctrl, pt)
		{
			if (!Addons.ClipFolder.IsHandle(Ctrl) || !confirmOk("Are you sure?")) {
				return;
			}
			var ar = GetSelectedArray(Ctrl, pt, true);
			var Selected = ar[0];
			FV = ar[2];
			var db = {};
			var bSave = false;
			Addons.ClipFolder.Open(FV, null, db);
			var arFV = Addons.ClipFolder.SyncFV(FV);
			for (var i in arFV) {
				arFV[i].Parent.LockUpdate();
				try {
					for (var j = Selected.Count; j--;) {
						arFV[i].RemoveItem(Selected.Item(j));
						var path = Selected.Item(j).Path;
						if (db[path]) {
							delete db[path];
							bSave = true;
						}
					}
				} catch (e) {}
				arFV[i].Parent.UnlockUpdate();
			}
			if (bSave) {
				Addons.ClipFolder.Save(FV, db);
			}
		},

		SyncFV: function (Ctrl)
		{
			var arFV = [Ctrl];
			var path = Addons.ClipFolder.GetPath(Ctrl);
			if (path) {
				var cFV = te.Ctrls(CTRL_FV);
				for (var i in cFV) {
					if (Ctrl.Id != cFV[i].Id) {
						if (path.toLowerCase() == (cFV[i].FolderItem.Path || "").toLowerCase()) {
							arFV.push(cFV[i]);
						}
					}
				}
			}
			return arFV;
		},

		Open: function (Ctrl, Items, db)
		{
			if (!Addons.ClipFolder.IsHandle(Ctrl)) {
				return;
			}
			var path = Addons.ClipFolder.GetPath(Ctrl);
			var ado = te.CreateObject(api.ADBSTRM);
			ado.CharSet = "utf-8";
			ado.Open();
			ado.LoadFromFile(path);
			while (!ado.EOS) {
				var s = ado.ReadText(adReadLine);
				if (s && !/^\s*#/.test(s)) {
					if (!/^[A-Z]:\\|^\\/i.test(s) && !/:/.test(s)) {
						s = fso.BuildPath(fso.GetParentFolderName(path), s);
					}
					if (Items) {
						Items.AddItem(s);
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
			if (!Addons.ClipFolder.IsHandle(Ctrl)) {
				return;
			}
			var path = Addons.ClipFolder.GetPath(Ctrl);
			var ado = te.CreateObject(api.ADBSTRM);
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
			var path = api.GetDisplayNameOf(FV, SHGDN_FORPARSING | SHGDN_FORADDRESSBAR | SHGDN_ORIGINAL);
			if (/^[A-Z]:\\|^\\/i.test(path)) {
				if (Addons.ClipFolder.IsHandle(path)) {
					var db = {};
					var Items = FV.Items();
					for (var i = 0; i < Items.Count; i++) {
						db[api.GetDisplayNameOf(Items.Item(i), SHGDN_FORPARSING | SHGDN_FORADDRESSBAR | SHGDN_ORIGINAL)] = 1;
					}
					Addons.ClipFolder.Save(FV, db);
				} else {
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
						Addons.ClipFolder.Add(Ctrl, api.OleGetClipboard());
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
			Ctrl.ENum = Addons.ClipFolder.Enum;
			return ssfRESULTSFOLDER;
		}
	}, true);

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
				Addons.ClipFolder.Add(Ctrl, dataObj);
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
			var path = api.GetDisplayNameOf(Selected.Item(0), SHGDN_FORPARSING | SHGDN_FORADDRESSBAR | SHGDN_ORIGINAL);
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

	AddEvent("GetIconImage", function (Ctrl, BGColor)
	{
		if (Addons.ClipFolder.IsHandle(Ctrl)) {
			return MakeImgSrc("bitmap:ieframe.dll,699,16,15", 0, false, 16);
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
			var path = api.GetDisplayNameOf(item, SHGDN_FORPARSING | SHGDN_FORADDRESSBAR | SHGDN_ORIGINAL);
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
