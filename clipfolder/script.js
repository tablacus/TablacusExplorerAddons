var Addon_Id = "clipfolder";

var items = te.Data.Addons.getElementsByTagName(Addon_Id);
if (items.length) {
	var item = items[0];
	if (!item.getAttribute("Set")) {
		item.setAttribute("Filter", "*.cfu");
		item.setAttribute("MenuExec", 1);
		item.setAttribute("Menu", "Background");
		item.setAttribute("MenuPos", -1);

		item.setAttribute("KeyOn", "List");

		item.setAttribute("MouseOn", "List");
	}
}

if (window.Addon == 1) {
	Addons.ClipFolder =
	{
		FindItemIndex: function (FV, Item)
		{
			var Items = FV.Items();
			var path = api.GetDisplayNameOf(Item, SHGDN_FORPARSING | SHGDN_FORADDRESSBAR);
			for (var i = Items.Count; i-- > 0;) {
				if (api.strcmpi(path, api.GetDisplayNameOf(Items.Item(i), SHGDN_FORPARSING | SHGDN_FORADDRESSBAR)) == 0) {
					return i;
				}
			}
			return -1;
		},

		Append: function (Ctrl, Items)
		{
			var arFV = Addons.ClipFolder.SyncFV(Ctrl);
			for (var i in arFV) {
				for (var j = 0; j < Items.Count; j++) {
					var Item = Items.Item(j);
					var nIndex = Addons.ClipFolder.FindItemIndex(arFV[i], Item);
					Item = nIndex < 0 ? arFV[i].AddItem(Item) : arFV[i].Items.Item(nIndex);
					arFV[i].SelectItem(Item, SVSI_SELECT | SVSI_FOCUSED | SVSI_ENSUREVISIBLE);
				}
			}
			Addons.ClipFolder.Save(Ctrl);
		},

		Remove: function (Ctrl, pt)
		{
			var ar = GetSelectedArray(Ctrl, pt, true);
			var Selected = ar[0];
			var arFV = Addons.ClipFolder.SyncFV(ar[2]);
			for (var i in arFV) {
				for (var j = Selected.Count; j--;) {
					arFV[i].RemoveItem(Selected.Item(j));
				}
			}
			Addons.ClipFolder.Save(ar[2]);
		},

		SyncFV: function (Ctrl)
		{
			var arFV = [];
			var path = api.GetDisplayNameOf(Ctrl.FolderItem, SHGDN_FORPARSING | SHGDN_FORADDRESSBAR);
			var cFV = te.Ctrls(CTRL_FV);
			for (var i in cFV) {
				var path2 = api.GetDisplayNameOf(cFV[i].FolderItem, SHGDN_FORPARSING | SHGDN_FORADDRESSBAR);
				if (api.strcmpi(path, path2) == 0) {
					arFV.push(cFV[i]);
				}
			}
			return arFV;
		},
		
		Save: function (Ctrl)
		{
			var path = api.GetDisplayNameOf(Ctrl.FolderItem, SHGDN_FORPARSING | SHGDN_FORADDRESSBAR);
			var ado = te.CreateObject("Adodb.Stream");
			ado.CharSet = "utf-8";
			ado.Open();
			var Items = Ctrl.Items();
			for (var i = 0; i < Items.Count; i++) {
				ado.WriteText(api.GetDisplayNameOf(Items.Item(i), SHGDN_FORPARSING | SHGDN_FORADDRESSBAR), adWriteLine);
			}
			ado.SaveToFile(path, adSaveCreateOverWrite);
			ado.Close();
		},

		Exec: function (Ctrl, pt)
		{
			var FV = GetFolderView(Ctrl, pt);
			var path = api.GetDisplayNameOf(FV, SHGDN_FORPARSING | SHGDN_FORADDRESSBAR);
			if (/^[A-Z]:\\|^\\/i.test(path)) {
				if (api.PathMatchSpec(path, Addons.ClipFolder.Spec)) {
					Addons.ClipFolder.Save(FV);
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
		}
	};

	AddEvent("TranslatePath", function (Ctrl, Path)
	{
		if (api.PathMatchSpec(Path, Addons.ClipFolder.Spec)) {
			return ssfRESULTSFOLDER;
		}
	}, true);

	AddEvent("ListViewCreated", function (Ctrl)
	{
		var path = Ctrl.FolderItem.Path;
		if (api.PathMatchSpec(path, Addons.ClipFolder.Spec)) {
			setTimeout(function ()
			{
				try {
					var Items = Ctrl.Items;
					for (var i = Items.Count; i--;) {
						Ctrl.RemoveItem(Items.Item(i));
					}
					var ado = te.CreateObject("Adodb.Stream");
					ado.CharSet = "utf-8";
					ado.Open();
					ado.LoadFromFile(path);
					while (!ado.EOS) {
						var s = ado.ReadText(adReadLine);
						if (s && !/^\s*#/.test(s)) {
							if (!/^[A-Z]:\\|^\\/i.test(s)) {
								s = fso.BuildPath(fso.GetParentFolderName(path), s);
							}
							Ctrl.AddItem(s);
						}
					}
					ado.Close();
				} catch (e) {
				}
			}, 100);
		}
	});

	AddEvent("DragEnter", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		if (Ctrl.Type <= CTRL_EB || Ctrl.Type == CTRL_DT) {
			var path = Ctrl.FolderItem.Path;
			if (api.PathMatchSpec(path, Addons.ClipFolder.Spec)) {
				return S_OK;
			}
		}
	});

	AddEvent("DragOver", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		if (Ctrl.Type <= CTRL_EB) {
			var path = Ctrl.FolderItem.Path;
			if (api.PathMatchSpec(path, Addons.ClipFolder.Spec)) {
				if (Ctrl.HitTest(pt, LVHT_ONITEM) < 0) {
					pdwEffect.X = DROPEFFECT_LINK;
					return S_OK;
				}
			}
		}
		if (Ctrl.Type == CTRL_DT) {
			var path = Ctrl.FolderItem.Path;
			if (api.PathMatchSpec(path, Addons.ClipFolder.Spec)) {
				pdwEffect.X = DROPEFFECT_LINK;
				return S_OK;
			}
		}
	});

	AddEvent("Drop", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		var path = api.GetDisplayNameOf(Ctrl.FolderItem, SHGDN_FORPARSING | SHGDN_FORADDRESSBAR);
		if (api.PathMatchSpec(path, Addons.ClipFolder.Spec)) {
			var nIndex = -1;
			if (Ctrl.Type <= CTRL_EB) {
				if (api.PathMatchSpec(path, Addons.ClipFolder.Spec)) {
					nIndex = Ctrl.HitTest(pt, LVHT_ONITEM);
				}
			}
			else if (Ctrl.Type != CTRL_DT) {
				return S_OK;
			}
			if (nIndex < 0) {
				Addons.ClipFolder.Append(Ctrl, dataObj);
			}
			return S_OK;
		}
	});

	AddEvent("Dragleave", function (Ctrl)
	{
		return S_OK;
	});

	AddEvent("Command", function (Ctrl, hwnd, msg, wParam, lParam)
	{
		if (Ctrl.Type <= CTRL_EB) {
			var path = api.GetDisplayNameOf(Ctrl, SHGDN_FORPARSING | SHGDN_FORADDRESSBAR);
			if (api.PathMatchSpec(path, Addons.ClipFolder.Spec)) {
				switch ((wParam & 0xfff) + 1) {
					case CommandID_PASTE:
						Addons.ClipFolder.Append(Ctrl, api.OleGetClipboard());
						return S_OK;
					case CommandID_DELETE:
						return S_OK;
				}
			}
		}
	});

	AddEvent("InvokeCommand", function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon)
	{
		var path = api.GetDisplayNameOf(ContextMenu.FolderView, SHGDN_FORPARSING | SHGDN_FORADDRESSBAR);
		if (api.PathMatchSpec(path, Addons.ClipFolder.Spec)) {
			switch (Verb + 1) {
				case CommandID_PASTE:
					Addons.ClipFolder.Append(ContextMenu.FolderView, api.OleGetClipboard());
					return S_OK;
				case CommandID_DELETE:
					return S_OK;
			}
		}
	}, true);

	AddEvent("DefaultCommand", function (Ctrl, Selected)
	{
		if (Selected.Count == 1) {
			var path = api.GetDisplayNameOf(Selected.Item(0), SHGDN_FORPARSING | SHGDN_FORADDRESSBAR);
			if (api.PathMatchSpec(path, Addons.ClipFolder.Spec)) {
				Ctrl.Navigate(path);
				return S_OK;
			}
		}
	}, true);

	AddEvent("ILGetParent", function (FolderItem)
	{
		var path = api.GetDisplayNameOf(FolderItem, SHGDN_FORPARSING | SHGDN_FORADDRESSBAR);
		if (api.PathMatchSpec(path, Addons.ClipFolder.Spec)) {
			return fso.GetParentFolderName(path);
		}
	});

	AddEvent("Context", function (Ctrl, hMenu, nPos, Selected, item)
	{
		var path = api.GetDisplayNameOf(Ctrl.FolderItem, SHGDN_FORPARSING | SHGDN_FORADDRESSBAR);
		if (api.PathMatchSpec(path, Addons.ClipFolder.Spec)) {
			api.InsertMenu(hMenu, -1, MF_BYPOSITION | MF_STRING, ++nPos, GetText('Remove'));
			ExtraMenuCommand[nPos] = Addons.ClipFolder.Remove;
		}
		return nPos;
	});

	AddEvent("Edit", function (Ctrl, hMenu, nPos, Selected, item)
	{
		var path = api.GetDisplayNameOf(item, SHGDN_FORPARSING | SHGDN_FORADDRESSBAR);
		if (api.PathMatchSpec(path, Addons.ClipFolder.Spec)) {
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

	if (items.length) {
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
	}
	te.HookDragDrop(CTRL_FV, true);
}
else {
	document.getElementById("tab0").value = "General";
	document.getElementById("panel0").innerHTML = '<label>Filter</label><input type="text" name="Filter" style="width: 100%" />';
	document.getElementById("panel7").insertAdjacentHTML("BeforeEnd", '<br /><label>Name</label>2<input type="text" name="MenuName2" style="width: 100%" />');
}
