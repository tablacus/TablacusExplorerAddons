var Addon_Id = "label";

var item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "Context");
	item.setAttribute("MenuPos", 1);

	item.setAttribute("KeyOn", "List");
	item.setAttribute("MouseOn", "List");
}

if (window.Addon == 1) {
	Addons.Label =
	{
		RE: /label:(.*)/i,
		CONFIG: fso.BuildPath(te.Data.DataFolder, "config\\label.tsv"),
		bSave: false,
		Changed: {},
		Redraw: {},
		nPosAdd: 0,
		nPosDel: 0,
		tid2: null,
		tidSync: null,
		SyncItem: {},
		Initd: false,
		Portable: api.LowPart(item.getAttribute("Portable")),
		Icon: "../addons/label/label16.png",

		IsHandle: function (Ctrl)
		{
			return Addons.Label.RE.exec(typeof(Ctrl) == "string" ? Ctrl : api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING));
		},

		Get: function (path)
		{
			return te.Labels[path] || "";
		},

		Edit: function (Ctrl, pt)
		{
			var Selected = GetSelectedArray(Ctrl, pt, true).shift();
			if (Selected && Selected.Count) {
				try {
					var path = api.GetDisplayNameOf(Selected.Item(0), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
					if (path) {
						var Label = Addons.Label.Get(path);
						var s = InputDialog(path + (Selected.Count > 1 ? " : " + Selected.Count : "") + "\nlabel:" + Label, Label);
						if (typeof(s) == "string") {
							for (var i = Selected.Count; i-- > 0;) {
								Addons.Label.Set(api.GetDisplayNameOf(Selected.Item(i), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING), s);
							}
						}
					}
				} catch (e) {
					wsh.Popup(e.description + "\n" + s, 0, TITLE, MB_ICONSTOP);
				}
			}
		},

		EditPath: function (Ctrl, pt)
		{
			var Selected = GetSelectedArray(Ctrl, pt, true).shift();
			if (Selected && Selected.Count == 1) {
				try {
					var path = api.GetDisplayNameOf(Selected.Item(0), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
					if (path) {
						var Label = Addons.Label.Get(path);
						var s = InputDialog("label:" + Label + "\n" + path, path);
						if (typeof(s) == "string") {
						 	api.SHParseDisplayName(function (pid, s, path, Label)
						 	{
								if (pid) {
									s = api.GetDisplayNameOf(pid, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
								}
								if (s != path) {
									if (Addons.Label.Get(s)) {
										wsh.Popup(api.LoadString(hShell32, 6327));
									} else {
										Addons.Label.Set(s, Label);
										Addons.Label.Set(path, "");
									}
								}
							}, 0, s, s, path, Label);
						}
					}
				} catch (e) {
					wsh.Popup(e.description + "\n" + s, 0, TITLE, MB_ICONSTOP);
				}
			}
		},

		Details: function (Ctrl, pt)
		{
			Ctrl.Columns = Ctrl.Columns + ' "System.Contact.Label" -1';
		},

		ExecRemoveItems: function (Ctrl, pt)
		{
			if (!confirmOk("Are you sure?")) {
				return;
			}
			var ar = GetSelectedArray(Ctrl, pt);
			var Selected = ar.shift();
			var SelItem = ar.shift();
			var FV = ar.shift();
			var Label = Addons.Label.LabelPath(FV);
			if (Label) {
				Addons.Label.RemoveItems(Selected, Label);
			}
		},

		LabelPath: function (Ctrl)
		{
			var res = Addons.Label.IsHandle(Ctrl);
			if (res) {
				return res[1];
			}
		},

		AddMenu: function (hMenu, hParent, nIndex)
		{
			hMenu = api.sscanf(hMenu, "%llx");
			var oList = {};
			Addons.Label.List(oList);
			var nPos = g_nPos;
			var nRes = 0;
			if (Addons.LabelGroups) {
				var mii = api.Memory("MENUITEMINFO");
				mii.cbSize = mii.Size;
				mii.fMask = MIIM_STRING | MIIM_SUBMENU;
				var db = Addons.LabelGroups.db;
				for (var s in db) {
					mii.hSubMenu = api.CreatePopupMenu();
					mii.dwTypeData = s.replace(/&/g, "&&");
					var ar = db[s];
					for (var i in ar) {
						nRes++;
						api.InsertMenu(mii.hSubMenu, MAXINT, MF_BYPOSITION | MF_STRING, ++g_nPos, ar[i].replace(/&/g, "&&"));
						ExtraMenuData[g_nPos] = ar[i];
						ExtraMenuCommand[g_nPos] = Addons.Label.ExecAdd;
						delete oList[ar[i]];
					}
					api.InsertMenuItem(hMenu, MAXINT, true, mii);
				}
			}

			for (var s in oList) {
				if (nRes) {
					api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_SEPARATOR, 0, null);
					nRes = 0;
				}
				api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, ++g_nPos, s.replace(/&/g, "&&"));
				ExtraMenuData[g_nPos] = s;
				ExtraMenuCommand[g_nPos] = Addons.Label.ExecAdd;
			}
			if (nPos == g_nPos) {
				hMenu = api.sscanf(hParent, "%llx");
				var mii = api.Memory("MENUITEMINFO");
				mii.cbSize = mii.Size;
				mii.fMask = MIIM_STATE;
				mii.fState = MFS_DISABLED;
				api.SetMenuItemInfo(hMenu, nIndex, true, mii);
			}
		},

		ExecAdd: function (Ctrl, pt, Name, nVerb)
		{
			if (!confirmOk("Are you sure?")) {
				return;
			}
			var FV = GetFolderView(Ctrl, pt);
			if (FV) {
				Selected = FV.SelectedItems();
				Addons.Label.AppendItems(Selected, ExtraMenuData[nVerb]);
			}
		},

		ExecRemove: function (Ctrl, pt, Name, nVerb)
		{
			if (!confirmOk("Are you sure?")) {
				return;
			}
			var FV = GetFolderView(Ctrl, pt);
			if (FV) {
				Selected = FV.SelectedItems();
				Addons.Label.RemoveItems(Selected, ExtraMenuData[nVerb]);
			}
		},

		Append: function (Item, Label)
		{
			var path = api.GetDisplayNameOf(Item, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
			if (path) {
				var ar = Addons.Label.Get(path).split(/\s*;\s*/);
				var o = {};
				for (var i in ar) {
					o[ar[i]] = 1;
				}
				var ar = String(Label || "").split(/\s*;\s*/);
				for (var i in ar) {
					o[ar[i]] = 1;
				}
				ar = [];
				delete o[""];
				for (var i in o) {
					ar.push(i);
				}
				Addons.Label.Set(path, ar.join(";"));
			}
		},

		AppendItems: function (Items, Label)
		{
			if (Items) {
				for (var i = 0; i < Items.Count; i++) {
					Addons.Label.Append(Items.Item(i), Label);
				}
			}
		},

		RemoveItems: function (Items, Label)
		{
			if (Items) {
				for (var i = Items.Count; i-- > 0;) {
					Addons.Label.Remove(Items.Item(i), Label);
				}
			}
		},

		Remove: function (Item, Label)
		{
			var s = "";
			var path = api.GetDisplayNameOf(Item, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
			if (path) {
				s = Addons.Label.Get(path);
				var arNew = [];
				if (Label) {
					var ar = String(s || "").split(/\s*;\s*/);
					var o = {};
					for (var i in ar) {
						o[ar[i]] = 1;
					}
					var ar = String(Label || "").split(/\s*;\s*/);
					for (var i in ar) {
						o[ar[i]] = 0;
					}
					for (var i in o) {
						if (o[i]) {
							arNew.push(i);
						}
					}
					if (Label == "*") {
						arNew = [];
					}
				}
				Addons.Label.Set(path, arNew.join(";"));
			}
			return s;
		},

		Set: function (path, s)
		{
			if (path) {
				var ar = Addons.Label.Get(path).split(/\s*;\s*/);
				s = s.replace(/[\\?\\*]/g, "");
				if (s) {
					te.Labels[path] = s;
				} else {
					delete te.Labels[path];
				}
				var o = {};
				var bChanged = false;
				for (var j in ar) {
					o[ar[j]] = 1;
				}
				ar = (s || "").split(/\s*;\s*/);
				for (var j in ar) {
					o[ar[j]] ^= 1;
				}
				for (var j in o) {
					if (o[j]) {
						Addons.Label.Changed[j] = 1;
						Addons.Label.Redraw[fso.GetParentFolderName(path)] = true;
						bChanged = true;
					}
				}
				if (bChanged) {
					clearTimeout(Addons.Label.tid2);
					Addons.Label.tid2 = setTimeout(Addons.Label.Notify, 500);
					Addons.Label.bSave = true;
				}
			}
		},

		Notify: function ()
		{
			var cFV = te.Ctrls(CTRL_FV);
			for (var i in cFV) {
				var FV = cFV[i];
				if (FV.hwnd) {
					var path = api.GetDisplayNameOf(FV, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
					if (Addons.Label.Redraw[path]) {
						api.InvalidateRect(FV.hwndList || FV.hwndView || FV.hwnd, null, false);
					}
					var s = Addons.Label.LabelPath(FV);
					if (s) {
						var b = false;
						for (var j in Addons.Label.Changed) {
							b = api.PathMatchSpec(j, s);
							if (b) {
								break;
							}
						}
						if (b) {
							FV.Refresh(true);
						}
					}
				}
			}
			Addons.Label.Changed = {};
			Addons.Label.Redraw = {};
		},

		List: function (list)
		{
			var ix = [];
			Addons.Label.ENumCB(function (path, s)
			{
				var ar = s.split(/\s*;\s*/);
				for (var i in ar) {
					var s = ar[i];
					if (s) {
						ix.push(s);
					}
				}
			});
			var ix = ix.sort(function (a, b) {
				return api.StrCmpLogical(b, a)
			});
			for (var i = ix.length; i--;) {
				list[ix[i]] = true;
			}
		},

		ENumCB: function (fncb)
		{
			for (var path in te.Labels) {
				fncb(path, te.Labels[path]);
			}
		},

		Sort: function (Ctrl, pt)
		{
			var FV = GetFolderView(Ctrl, pt);
			if (!FV) {
				return S_OK;
			}
			var Items = FV.Items();
			var List = [];
			for (var i = Items.Count; i--;) {
				List.push([i, Addons.Label.Get(api.GetDisplayNameOf(Items.Item(i), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING))]);
			}
			var bRev = FV.SortColumn == "" && !Addons.Label.bRev;
			List.sort(bRev ? function (a, b) { return api.StrCmpLogical(a[1], b[1]); } : function (b, a) { return api.StrCmpLogical(a[1], b[1]); });
			Addons.Label.bRev = bRev;

			FV.Parent.LockUpdate();
			try {
				var ViewMode = api.SendMessage(FV.hwndList, LVM_GETVIEW, 0, 0);
				if (ViewMode == 1 || ViewMode == 3) {
					api.SendMessage(FV.hwndList, LVM_SETVIEW, 4, 0);
				}
				var FolderFlags = FV.FolderFlags;
				FV.FolderFlags = FolderFlags | FWF_AUTOARRANGE;
				FV.GroupBy = "System.Null";
				var pt = api.Memory("POINT");
				FV.GetItemPosition(Items.Item(0), pt);
				for (var i in List) {
					FV.SelectAndPositionItem(Items.Item(List[i][0]), 0, pt);
				}
				api.SendMessage(FV.hwndList, LVM_SETVIEW, ViewMode, 0);
				FV.FolderFlags = FolderFlags;
			} catch (e) {}
			FV.Parent.UnlockUpdate(true);
		}
	}

	AddEvent("Load", function ()
	{
		if (!Addons.Label.Initd) {
			te.Labels = te.Object();
			try {
				var ado = te.CreateObject(api.ADBSTRM);
				ado.CharSet = "utf-8";
				ado.Open();
				ado.LoadFromFile(Addons.Label.CONFIG);
				while (!ado.EOS) {
					var ar = ado.ReadText(adReadLine).split("\t");
					te.Labels[ar[0]] = ar[1];
				}
				ado.Close();
				delete te.Labels[""];
			} catch (e) {}

			AddEvent("SaveConfig", function ()
			{
				if (Addons.Label.bSave) {
					try {
						var ado = te.CreateObject(api.ADBSTRM);
						ado.CharSet = "utf-8";
						ado.Open();
						delete te.Labels[""];
						Addons.Label.ENumCB(function (path, label)
						{
							ado.WriteText([path, label].join("\t") + "\r\n");
						});
						ado.SaveToFile(Addons.Label.CONFIG, adSaveCreateOverWrite);
						ado.Close();
						Addons.Label.bSave = false;
					} catch (e) {}
				}
			});
		}

		var Installed0 = Addons.Label.Get('%Installed%').toUpperCase();
		var Installed1 = Addons.Label.Portable ? fso.GetDriveName(api.GetModuleFileName(null)).toUpperCase() : "";
		if (Installed0 && Addons.Label.Portable && Installed0 != Installed1) {
			Addons.Label.ENumCB(function (path, label)
			{
				var drv = fso.GetDriveName(path);
				if (drv.toUpperCase() == Installed0) {
					Addons.Label.Set(path, "");
					Addons.Label.Set(Installed1 + path.substr(drv.length), label);
				}
			});
		}
		if (Addons.Label.Portable || Installed0) {
			Addons.Label.Set('%Installed%', Installed1);
		}
	});

	AddEvent("TranslatePath", function (Ctrl, Path)
	{
		if (Addons.Label.IsHandle(Path)) {
			Ctrl.ENum = function (pid, Ctrl, fncb)
			{
				var Items = te.FolderItems();
				var b, ar;
				var Label = Addons.Label.LabelPath(pid);
				var bWC = /[\*\?]/.test(Label);
				Addons.Label.ENumCB(function (path, s)
				{
					var parent = fso.GetParentFolderName(path);
					if (bWC || (Label.indexOf(" ") >= 0 && Label.indexOf(";") < 0)) {
						b = true;
						ar = null;
						var ar2 = Label.split(/\s+/);
						for (var j in ar2) {
							var s2 = ar2[j];
							if (s2 && !api.PathMatchSpec(s2, s) && !api.PathMatchSpec(parent, s2)) {
								b = false;
								if (bWC) {
									ar = s.split(/\s*;\s*/);
									for (var i in ar) {
										if (api.PathMatchSpec(ar[i], s2)) {
											b = true;
											break;
										}
									}
								}
								break;
							}
						}
					} else {
						b = api.PathMatchSpec(Label, s) || api.PathMatchSpec(parent, Label);
					}
					if (!b && bWC) {
						ar = ar || s.split(/\s*;\s*/);
						for (var i in ar) {
							if (api.PathMatchSpec(ar[i], Label) || api.PathMatchSpec(parent, Label)) {
								b = true;
								break;
							}
						}
					}
					if (b && path !="%Installed%") {
						Items.AddItem(path);
					}
				});
				return Items;
			};
			return ssfRESULTSFOLDER;
		}
	}, true);

	AddEvent("GetFolderItemName", function (pid)
	{
		var Label = Addons.Label.LabelPath(pid);
		if (Label) {
			return "label:" + Label;
		}
	}, true);

	AddEvent("GetIconImage", function (Ctrl, BGColor)
	{
		if (Addons.Label.IsHandle(Ctrl)) {
			return Addons.Label.Icon;
		}
	});

	AddEvent("Command", function (Ctrl, hwnd, msg, wParam, lParam)
	{
		if (Ctrl.Type == CTRL_SB || Ctrl.Type == CTRL_EB) {
			if (Addons.Label.IsHandle(Ctrl)) {
				if ((wParam & 0xfff) == CommandID_DELETE - 1) {
					Addons.Label.ExecRemoveItems(Ctrl);
					return S_OK;
				}
			}
		}
	}, true);

	AddEvent("InvokeCommand", function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon)
	{
		if (Verb == CommandID_DELETE - 1) {
			var FV = ContextMenu.FolderView;
			if (FV && Addons.Label.IsHandle(FV)) {
				return S_OK;
			}
		}
		if (!Verb || Verb == CommandID_STORE - 1) {
			if (ContextMenu.Items.Count >= 1) {
				var path = api.GetDisplayNameOf(ContextMenu.Items.Item(0), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
				if (Addons.Label.IsHandle(path)) {
					var FV = te.Ctrl(CTRL_FV);
					FV.Navigate(path, SBSP_SAMEBROWSER);
					return S_OK;
				}
			}
		}
	}, true);

	AddEvent("DragEnter", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		if (Ctrl.Type <= CTRL_EB || Ctrl.Type == CTRL_DT) {
			var Label = Addons.Label.LabelPath(Ctrl);
			if (Label && !/[\?\*;]/.test(Label)) {
				return S_OK;
			}
		}
	});

	AddEvent("DragOver", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		if (Ctrl.Type <= CTRL_EB) {
			var Label = Addons.Label.LabelPath(Ctrl);
			if (Label && !/[\?\*;]/.test(Label)) {
				if (Ctrl.HitTest(pt, LVHT_ONITEM) < 0) {
					pdwEffect[0] = DROPEFFECT_LINK;
					return S_OK;
				}
			}
		}
		if (Ctrl.Type == CTRL_DT) {
			var Label = Addons.Label.LabelPath(Ctrl);
			if (Label && !/[\?\*;]/.test(Label)) {
				pdwEffect[0] = DROPEFFECT_LINK;
				return S_OK;
			}
		}
	});

	AddEvent("Drop", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		var Label = Addons.Label.LabelPath(Ctrl);
		if (Label && !/[\?\*;]/.test(Label)) {
			var nIndex = -1;
			if (Ctrl.Type <= CTRL_EB) {
				nIndex = Ctrl.HitTest(pt, LVHT_ONITEM);
			} else if (Ctrl.Type != CTRL_DT) {
				return S_OK;
			}
			if (nIndex < 0) {
				Addons.Label.AppendItems(dataObj, Label);
			}
			return S_OK;
		}
	});

	AddEvent("DragLeave", function (Ctrl)
	{
		return S_OK;
	});

	AddEvent("ChangeNotify", function (Ctrl, pidls)
	{
		if (te.Labels) {
			if (pidls.lEvent & (SHCNE_RENAMEFOLDER | SHCNE_RENAMEITEM)) {
				Addons.Label.Append(pidls[1], Addons.Label.Remove(pidls[0]));
			}
			if (pidls.lEvent & SHCNE_DELETE) {
				var name = fso.GetFileName(api.GetDisplayNameOf(pidls[0], SHGDN_FORADDRESSBAR | SHGDN_FORPARSING));
				Addons.Label.SyncItem[name] = pidls[0];
				clearTimeout(Addons.Label.tidSync);
				Addons.Label.tidSync = setTimeout(function ()
				{
					Addons.Label.tidSync = null;
					Addons.Label.SyncItem = {};
				}, 500);
			}
			if (pidls.lEvent & SHCNE_CREATE) {
				var name = fso.GetFileName(api.GetDisplayNameOf(pidls[0], SHGDN_FORADDRESSBAR | SHGDN_FORPARSING));
				var pidl = Addons.Label.SyncItem[name];
				if (pidl) {
					Addons.Label.Append(pidls[0], Addons.Label.Remove(pidl));
				}
			}
		}
	});

	AddEvent("Context", function (Ctrl, hMenu, nPos, Selected, item, ContextMenu)
	{
		if (Addons.Label.IsHandle(Ctrl)) {
			RemoveCommand(hMenu, ContextMenu, "delete;rename");
			api.InsertMenu(hMenu, -1, MF_BYPOSITION | MF_STRING, ++nPos, api.LoadString(hShell32, 31368));
			ExtraMenuCommand[nPos] = OpenContains;
			api.InsertMenu(hMenu, -1, MF_BYPOSITION | MF_STRING, ++nPos, GetText('Remove'));
			ExtraMenuCommand[nPos] = Addons.Label.ExecRemoveItems;
		}
		return nPos;
	});

	AddEvent("ColumnClick", function (Ctrl, iItem)
	{
		var cColumns = api.CommandLineToArgv(Ctrl.Columns(1));
		if (cColumns[iItem * 2] == "System.Contact.Label") {
			(function (FV) { setTimeout(function () {
				Addons.Label.Sort(FV, null);
			}, 99);}) (Ctrl);
			return S_OK;
		}
	});

	AddEvent("FilterChanged", function (Ctrl)
	{
		var res = /^\*?label:.+/i.exec(Ctrl.FilterView);
		if (res) {
			Ctrl.OnIncludeObject = function (Ctrl, Path1, Path2, Item)
			{
				var res = /^(\*)?label:\s*(.*)/i.exec(Ctrl.FilterView);
				if (res) {
					var s = res[2];
					if (res[1]) {
						s = s.substr(0, s.length - 1);
					}
					var ar = Addons.Label.Get(Item.Path).split(";");
					for (var i in ar) {
						if (PathMatchEx(ar[i], s)) {
							return S_OK;
						}
					}
					return S_FALSE;
				}
			}
			return S_OK;
		}
	});

	Addons.Label.strName = GetText(item.getAttribute("MenuName") || api.PSGetDisplayName("System.Contact.Label"));
	//Menu
	if (item.getAttribute("MenuExec")) {
		Addons.Label.nPos = api.LowPart(item.getAttribute("MenuPos"));
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos, Selected, item)
		{
			if (item && item.IsFileSystem) {
				var mii = api.Memory("MENUITEMINFO");
				mii.cbSize = mii.Size;
				mii.fMask = MIIM_STRING | MIIM_SUBMENU;
				mii.hSubMenu = api.CreatePopupMenu();
				mii.dwTypeData = Addons.Label.strName;
				if (Selected && Selected.Count) {
					var path = api.GetDisplayNameOf(Selected.Item(0), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
					if (path) {
						var ar = [GetText("&Edit")];
						var s = Addons.Label.Get(path);
						if (s) {
							ar.push(s.replace(/&/g, "&&"));
						}
						api.InsertMenu(mii.hSubMenu, 0, MF_BYPOSITION | MF_STRING, ++nPos, ar.join(' - '));
						ExtraMenuCommand[nPos] = Addons.Label.Edit;

						if (s && Selected.Count == 1) {
							api.InsertMenu(mii.hSubMenu, MAXINT, MF_BYPOSITION | MF_STRING, ++nPos, GetText("Path"));
							ExtraMenuCommand[nPos] = Addons.Label.EditPath;
						}
					}
				}
				if (Ctrl.CurrentViewMode == FVM_DETAILS) {
					if (!/"System\.Contact\.Label"/.test(Ctrl.Columns(1))) {
						api.InsertMenu(mii.hSubMenu, MAXINT, MF_BYPOSITION | MF_STRING, ++nPos, GetText("Details"));
						ExtraMenuCommand[nPos] = Addons.Label.Details;
					}
				}
				if (WINVER >= 0x600) {
					api.InsertMenu(mii.hSubMenu, MAXINT, MF_BYPOSITION | MF_STRING, ++nPos, api.LoadString(hShell32, 50690));
					ExtraMenuCommand[nPos] = Addons.Label.Sort;
				}
				var mii2 = api.Memory("MENUITEMINFO");
				mii2.cbSize = mii.Size;
				mii2.fMask = MIIM_STRING | MIIM_SUBMENU;
				mii2.hSubMenu = api.CreatePopupMenu();
				mii2.dwTypeData = GetText("Add");
				api.InsertMenu(mii2.hSubMenu, 0, MF_BYPOSITION | MF_STRING, 0, api.sprintf(99, '\tJScript\tAddons.Label.AddMenu("%llx", "%llx", %d)', mii2.hSubMenu, mii.hSubMenu, 1));
				api.InsertMenuItem(mii.hSubMenu, MAXINT, true, mii2);

				mii2.fMask = MIIM_STRING | MIIM_SUBMENU | MIIM_STATE;
				mii2.fState = MFS_DISABLED;
				mii2.hSubMenu = api.CreatePopupMenu();
				mii2.dwTypeData = GetText("Remove");
				var o = {};
				for (var i = Selected.Count; i-- > 0;) {
					var path = api.GetDisplayNameOf(Selected.Item(i), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
					if (path) {
						var ar = Addons.Label.Get(path).split(/\s*;\s*/);
						for (var j in ar) {
							o[ar[j]] = 1;
						}
					}
				}
				var nPos2 = nPos;
				delete o[""];
				for (var s in o) {
					api.InsertMenu(mii2.hSubMenu, MAXINT, MF_BYPOSITION | MF_STRING, ++nPos, s.replace(/&/g, "&&"));
					mii2.fState = MFS_ENABLED;
					ExtraMenuData[nPos] = s;
					ExtraMenuCommand[nPos] = Addons.Label.ExecRemove;
				}
				api.InsertMenuItem(mii.hSubMenu, MAXINT, true, mii2);

				api.InsertMenuItem(hMenu, Addons.Label.nPos, true, mii);
			}
			return nPos;
		});
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.Label.Edit, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.Label.Edit, "Func");
	}
	AddTypeEx("Add-ons", "Label", Addons.Label.Edit);

	var icon = item.getAttribute("Icon");
	if (icon) {
		Addons.Label.Icon = MakeImgSrc(icon, 0, false, 16);
	}
} else {
	SetTabContents(0, "General", '<input type="checkbox" id="Portable" /><label for="Portable">Portable</label>');
	ChangeForm([["__IconSize", "style/display", "none"]]);
}