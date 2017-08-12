var Addon_Id = "badge";

var item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "Context");
	item.setAttribute("MenuPos", 1);

	item.setAttribute("KeyOn", "List");
	item.setAttribute("MouseOn", "List");
}

if (window.Addon == 1) {
	Addons.Badge =
	{
		RE: /badge:(.*)/i,
		CONFIG: fso.BuildPath(te.Data.DataFolder, "config\\badge.tsv"),
		bSave: false,
		Changed: {},
		Redraw: {},
		nPosAdd: 0,
		nPosDel: 0,
		tid: [],
		tid2: null,
		tidSync: null,
		SyncItem: {},
		Initd: false,
		Portable: api.LowPart(item.getAttribute("Portable")),
		Bottom: api.LowPart(item.getAttribute("Bottom")),
		Image: [],

		IsHandle: function (Ctrl)
		{
			return Addons.Badge.RE.exec(typeof(Ctrl) == "string" ? Ctrl : api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING));
		},

		Get: function (path)
		{
			return te.Data.Badges && te.Data.Badges[path] || "";
		},

		SetX: function (Ctrl, pt, s)
		{
			var Selected = GetSelectedArray(Ctrl, pt, true).shift();
			if (Selected && Selected.Count) {
				for (var i = Selected.Count; i-- > 0;) {
					Addons.Badge.Set(api.GetDisplayNameOf(Selected.Item(i), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING), s);
				}
			}
		},

		Set0: function (Ctrl, pt)
		{
			Addons.Badge.SetX(Ctrl, pt, 0);
		},

		Set1: function (Ctrl, pt)
		{
			Addons.Badge.SetX(Ctrl, pt, 1);
		},

		Set2: function (Ctrl, pt)
		{
			Addons.Badge.SetX(Ctrl, pt, 2);
		},

		Set3: function (Ctrl, pt)
		{
			Addons.Badge.SetX(Ctrl, pt, 3);
		},

		Set4: function (Ctrl, pt)
		{
			Addons.Badge.SetX(Ctrl, pt, 4);
		},

		Set5: function (Ctrl, pt)
		{
			Addons.Badge.SetX(Ctrl, pt, 5);
		},

		Open0: function (Ctrl, pt)
		{
			Navigate("Badge:*");
		},

		Open1: function (Ctrl, pt)
		{
			Navigate("Badge:1");
		},

		Open2: function (Ctrl, pt)
		{
			Navigate("Badge:2");
		},

		Open3: function (Ctrl, pt)
		{
			Navigate("Badge:3");
		},

		Open4: function (Ctrl, pt)
		{
			Navigate("Badge:4");
		},

		Open5: function (Ctrl, pt)
		{
			Navigate("Badge:5");
		},

		EditPath: function (Ctrl, pt)
		{
			var Selected = GetSelectedArray(Ctrl, pt, true).shift();
			if (Selected && Selected.Count == 1) {
				try {
					var path = api.GetDisplayNameOf(Selected.Item(0), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
					if (path) {
						var Badge = Addons.Badge.Get(path);
						var s = InputDialog("Badge:" + Badge + "\n" + path, path);
						if (typeof(s) == "string") {
						 	api.SHParseDisplayName(function (pid, s, path, Badge)
						 	{
								if (pid) {
									s = api.GetDisplayNameOf(pid, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
								}
								if (s != path) {
									if (Addons.Badge.Get(s)) {
										wsh.Popup(api.LoadString(hShell32, 6327));
									} else {
										Addons.Badge.Set(s, Badge);
										Addons.Badge.Set(path, "");
									}
								}
							}, 0, s, s, path, Badge);
						}
					}
				} catch (e) {
					wsh.Popup(e.description + "\n" + s, 0, TITLE, MB_ICONSTOP);
				}
			}
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
			var Badge = Addons.Badge.BadgePath(FV);
			if (Badge) {
				Addons.Badge.RemoveItems(Selected, Badge);
			}
		},

		BadgePath: function (Ctrl)
		{
			var res = Addons.Badge.IsHandle(Ctrl);
			if (res) {
				return res[1];
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
				Addons.Badge.AppendItems(Selected, ExtraMenuData[nVerb]);
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
				Addons.Badge.RemoveItems(Selected, ExtraMenuData[nVerb]);
			}
		},

		AppendItems: function (Items, Badge)
		{
			if (Items) {
				for (var i = 0; i < Items.Count; i++) {
					Addons.Badge.Set(Items.Item(i), Badge);
				}
			}
		},

		RemoveItems: function (Items, Badge)
		{
			if (Items) {
				for (var i = Items.Count; i-- > 0;) {
					Addons.Badge.Remove(Items.Item(i), Badge);
				}
			}
		},

		Remove: function (Item, Badge)
		{
			var s = "";
			var path = api.GetDisplayNameOf(Item, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
			if (path) {
				s = Addons.Badge.Get(path);
				Addons.Badge.Set(path, 0);
			}
			return s;
		},

		Set: function (path, s)
		{
			if (path) {
				if (!/string/i.test(typeof path)) {
					path = api.GetDisplayNameOf(path, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
				}
				s = api.LowPart(s);
				if (s != te.Data.Badges[path]) {
					if (s) {
						te.Data.Badges[path] = s;
					} else {
						delete te.Data.Badges[path];
					}
					clearTimeout(Addons.Badge.tid2);
					Addons.Badge.tid2 = setTimeout(Addons.Badge.Notify, 500);
					Addons.Badge.bSave = true;
					Addons.Badge.Redraw[fso.GetParentFolderName(path)] = true;
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
					if (Addons.Badge.Redraw[path]) {
						api.InvalidateRect(FV.hwndList || FV.hwndView || FV.hwnd, null, false);
					}
					var s = Addons.Badge.BadgePath(FV);
					if (s) {
						var b = false;
						for (var j in Addons.Badge.Changed) {
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
			Addons.Badge.Changed = {};
			Addons.Badge.Redraw = {};
		},

		List: function (list)
		{
			var ix = [];
			Addons.Badge.ENumCB(function (path, s)
			{
				if (s) {
					ix.push(s);
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
			for (var path in te.Data.Badges) {
				fncb(path, te.Data.Badges[path]);
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
				List.push([i, Addons.Badge.Get(api.GetDisplayNameOf(Items.Item(i), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING))]);
			}
			var bRev = FV.SortColumn == "" && !Addons.Badge.bRev;
			List.sort(bRev ? function (a, b) { return api.StrCmpLogical(a[1], b[1]); } : function (b, a) { return api.StrCmpLogical(a[1], b[1]); });
			Addons.Badge.bRev = bRev;

			FV.Parent.LockUpdate();
			try {
				var args = { FV: FV, Items: Items, List: List};
				args.ViewMode = FV.CurrentViewMode;
				if (args.ViewMode == FVM_DETAILS || args.ViewMode == FVM_LIST) {
					FV.CurrentViewMode = FVM_TILE;
				}
				args.FolderFlags = FV.FolderFlags;
				FV.FolderFlags = args.FolderFlags | FWF_AUTOARRANGE;
				FV.GroupBy = "System.Null";
				var f = ((2 ^ FV.CurrentViewMode) | (2 ^ args.ViewMode)) * 2;
				if (te.Layout & f) {
					te.Layout &= ~f;
					FV.Suspend();
				}
			}
			catch (e) {}
			(function (args) { setTimeout(function () {
				Addons.Badge.Order(args);
			}, 99);}) (args);
		},

		Order: function (args)
		{
			try  {
				var pt = api.Memory("POINT");
				args.FV.GetItemPosition(args.Items.Item(0), pt);
				for (var i in args.List) {
					args.FV.SelectAndPositionItem(args.Items.Item(args.List[i][0]), 0, pt);
				}
				args.FV.CurrentViewMode = args.ViewMode;
				args.FV.FolderFlags = args.FolderFlags;
				te.Layout = te.Data.Conf_Layout;
			} catch (e) {}
			args.FV.Parent.UnlockUpdate(true);
		}
	}

	AddEvent("Load", function ()
	{
		if (!Addons.Badge.Initd) {
			te.Data.Badges = te.Object();
			try {
				var ado = te.CreateObject(api.ADBSTRM);
				ado.CharSet = "utf-8";
				ado.Open();
				ado.LoadFromFile(Addons.Badge.CONFIG);
				while (!ado.EOS) {
					var ar = ado.ReadText(adReadLine).split("\t");
					te.Data.Badges[ar[0]] = ar[1];
				}
				ado.Close();
				delete te.Data.Badges[""];
			} catch (e) {}

			AddEvent("SaveConfig", function ()
			{
				if (Addons.Badge.bSave) {
					try {
						var ado = te.CreateObject(api.ADBSTRM);
						ado.CharSet = "utf-8";
						ado.Open();
						delete te.Data.Badges[""];
						Addons.Badge.ENumCB(function (path, badge)
						{
							ado.WriteText([path, badge].join("\t") + "\r\n");
						});
						ado.SaveToFile(Addons.Badge.CONFIG, adSaveCreateOverWrite);
						ado.Close();
						Addons.Badge.bSave = false;
					} catch (e) {}
				}
			});
		}

		var Installed0 = Addons.Badge.Get('%Installed%').toUpperCase();
		var Installed1 = Addons.Badge.Portable ? fso.GetDriveName(api.GetModuleFileName(null)).toUpperCase() : "";
		if (Installed0 && Addons.Badge.Portable && Installed0 != Installed1) {
			Addons.Badge.ENumCB(function (path, badge)
			{
				var drv = fso.GetDriveName(path);
				if (drv.toUpperCase() == Installed0) {
					Addons.Badge.Set(path, "");
					Addons.Badge.Set(Installed1 + path.substr(drv.length), badge);
				}
			});
		}
		if (Addons.Badge.Portable || Installed0) {
			Addons.Badge.Set('%Installed%', Installed1);
		}
	});

	AddEvent("BeginNavigate", function (Ctrl)
	{
		var Badge = Addons.Badge.BadgePath(Ctrl);
		if (Badge && !Addons.Badge.tid[Ctrl.Id]) {
			Ctrl.SortColumn = "";
			Addons.Badge.tid[Ctrl.Id] = setTimeout(function ()
			{
				delete Addons.Badge.tid[Ctrl.Id];
				var arItems = [];
				Addons.Badge.ENumCB(function (path, s)
				{
					var parent = fso.GetParentFolderName(path);
					if (api.PathMatchSpec(Badge, s) || api.PathMatchSpec(parent, Badge)) {
						arItems.push(path);
					}
				});
				Ctrl.AddItems(arItems, true, true);
			}, 99);
			return S_FALSE;
		}
	});

	AddEvent("TranslatePath", function (Ctrl, Path)
	{
		if (Addons.Badge.IsHandle(Path)) {
			return ssfRESULTSFOLDER;
		}
	}, true);

	AddEvent("GetTabName", function (Ctrl)
	{
		var arg = api.CommandLineToArgv(Addons.Badge.BadgePath(Ctrl));
		return fso.GetFileName(arg[0]) || undefined;
	}, true);

	AddEvent("GetIconImage", function (Ctrl, BGColor)
	{
		if (Addons.Badge.IsHandle(Ctrl)) {
			return MakeImgSrc("icon:shell32.dll,4,16", 0, false, 16);
		}
	});

	AddEvent("Command", function (Ctrl, hwnd, msg, wParam, lParam)
	{
		if (Ctrl.Type == CTRL_SB || Ctrl.Type == CTRL_EB) {
			if (Addons.Badge.IsHandle(Ctrl)) {
				if ((wParam & 0xfff) == CommandID_DELETE - 1) {
					Addons.Badge.ExecRemoveItems(Ctrl);
					return S_OK;
				}
			}
		}
	}, true);

	AddEvent("InvokeCommand", function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon)
	{
		if (Verb == CommandID_DELETE - 1) {
			var FV = ContextMenu.FolderView;
			if (FV && Addons.Badge.IsHandle(FV)) {
				return S_OK;
			}
		}
		if (!Verb || Verb == CommandID_STORE - 1) {
			if (ContextMenu.Items.Count >= 1) {
				var path = api.GetDisplayNameOf(ContextMenu.Items.Item(0), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
				if (Addons.Badge.IsHandle(path)) {
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
			var Badge = Addons.Badge.BadgePath(Ctrl);
			if (Badge && !/[\?\*;]/.test(Badge)) {
				return S_OK;
			}
		}
	});

	AddEvent("DragOver", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		if (Ctrl.Type <= CTRL_EB) {
			var Badge = Addons.Badge.BadgePath(Ctrl);
			if (Badge && !/[\?\*;]/.test(Badge)) {
				if (Ctrl.HitTest(pt, LVHT_ONITEM) < 0) {
					pdwEffect[0] = DROPEFFECT_LINK;
					return S_OK;
				}
			}
		}
		if (Ctrl.Type == CTRL_DT) {
			var Badge = Addons.Badge.BadgePath(Ctrl);
			if (Badge && !/[\?\*;]/.test(Badge)) {
				pdwEffect[0] = DROPEFFECT_LINK;
				return S_OK;
			}
		}
	});

	AddEvent("Drop", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		var Badge = Addons.Badge.BadgePath(Ctrl);
		if (Badge && !/[\?\*;]/.test(Badge)) {
			var nIndex = -1;
			if (Ctrl.Type <= CTRL_EB) {
				nIndex = Ctrl.HitTest(pt, LVHT_ONITEM);
			} else if (Ctrl.Type != CTRL_DT) {
				return S_OK;
			}
			if (nIndex < 0) {
				Addons.Badge.AppendItems(dataObj, Badge);
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
		if (te.Data.Badges) {
			if (pidls.lEvent & (SHCNE_RENAMEFOLDER | SHCNE_RENAMEITEM)) {
				Addons.Badge.Set(pidls[1], Addons.Badge.Remove(pidls[0]));
			}
			if (pidls.lEvent & SHCNE_DELETE) {
				var name = fso.GetFileName(api.GetDisplayNameOf(pidls[0], SHGDN_FORADDRESSBAR | SHGDN_FORPARSING));
				Addons.Badge.SyncItem[name] = pidls[0];
				clearTimeout(Addons.Badge.tidSync);
				Addons.Badge.tidSync = setTimeout(function ()
				{
					Addons.Badge.tidSync = null;
					Addons.Badge.SyncItem = {};
				}, 500);
			}
			if (pidls.lEvent & SHCNE_CREATE) {
				var name = fso.GetFileName(api.GetDisplayNameOf(pidls[0], SHGDN_FORADDRESSBAR | SHGDN_FORPARSING));
				var pidl = Addons.Badge.SyncItem[name];
				if (pidl) {
					Addons.Badge.Set(pidls[0], Addons.Badge.Remove(pidl));
				}
			}
		}
	});

	AddEvent("Context", function (Ctrl, hMenu, nPos, Selected, item, ContextMenu)
	{
		if (Addons.Badge.IsHandle(Ctrl)) {
			RemoveCommand(hMenu, ContextMenu, "delete;rename");
			api.InsertMenu(hMenu, -1, MF_BYPOSITION | MF_STRING, ++nPos, api.LoadString(hShell32, 31368));
			ExtraMenuCommand[nPos] = OpenContains;
			api.InsertMenu(hMenu, -1, MF_BYPOSITION | MF_STRING, ++nPos, GetText('Remove'));
			ExtraMenuCommand[nPos] = Addons.Badge.ExecRemoveItems;
		}
		return nPos;
	});

	AddEvent("ItemPostPaint2", function (Ctrl, pid, nmcd, vcd)
	{
		var hList = Ctrl.hwndList;
		if (hList) {
			var image = Addons.Badge.Image[Addons.Badge.Get(pid.Path)];
			if (image) {
				var rc = api.Memory("RECT");
				rc.Left = LVIR_ICON;
				api.SendMessage(hList, LVM_GETITEMRECT, nmcd.dwItemSpec, rc);
				if (api.SendMessage(hList, LVM_GETVIEW, 0, 0) == 1) {
					var i = api.SendMessage(hList, LVM_GETCOLUMNWIDTH, 0, 0);
					if (rc.Right > i) {
						rc.Right = i;
					}
				}
				image = GetThumbnail(image, (rc.Bottom - rc.Top) / 2, true);
				if (image) {
					image.DrawEx(nmcd.hdc, rc.Right - image.GetWidth(), Addons.Badge.Bottom ? rc.Bottom - image.GetHeight() : rc.Top, 0, 0, CLR_NONE, CLR_NONE, ILD_NORMAL);
				}
			}
		}
	});

	AddEvent("FilterChanged", function (Ctrl)
	{
		var res = /^\*?badge:[^*]+/i.exec(Ctrl.FilterView);
		if (res) {
			Ctrl.OnIncludeObject = function (Ctrl, Path1, Path2, Item)
			{
				var res = /^\*?badge:\s*([<=>]*)(\d+)/i.exec(Ctrl.FilterView);
				if (res) {
					switch (res[1]) {
						case '<':
							return (Addons.Badge.Get(Item.Path) || 0) < res[2] ? S_OK : S_FALSE;
						case '>':
							return (Addons.Badge.Get(Item.Path) || 0) > res[2] ? S_OK : S_FALSE;
						case '<=':
							return (Addons.Badge.Get(Item.Path) || 0) <= res[2] ? S_OK : S_FALSE;
						case '>=':
							return (Addons.Badge.Get(Item.Path) || 0) >= res[2] ? S_OK : S_FALSE;
						default:
							return (Addons.Badge.Get(Item.Path) || 0) == res[2] ? S_OK : S_FALSE;
					}
				}
			}
			return S_OK;
		}
	});

	Addons.Badge.strName = item.getAttribute("MenuName");
	if (!Addons.Badge.strName) {
		var info = GetAddonInfo(Addon_Id);
		Addons.Badge.strName = info.Name;
	}
	//Menu
	if (item.getAttribute("MenuExec")) {
		Addons.Badge.nPos = api.LowPart(item.getAttribute("MenuPos"));
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos, Selected, item)
		{
			if (item && item.IsFileSystem) {
				var mii = api.Memory("MENUITEMINFO");
				mii.cbSize = mii.Size;
				mii.fMask = MIIM_STRING | MIIM_SUBMENU;
				mii.hSubMenu = api.CreatePopupMenu();
				mii.dwTypeData = Addons.Badge.strName;
				if (Selected && Selected.Count) {
					var path = api.GetDisplayNameOf(Selected.Item(0), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
					if (path) {
						var mii2 = api.Memory("MENUITEMINFO");
						mii2.cbSize = mii.Size;
						mii2.fMask = MIIM_STRING | MIIM_SUBMENU;
						mii2.hSubMenu = api.CreatePopupMenu();
						mii2.dwTypeData = api.LoadString(hShell32, 12850);
						var s = Addons.Badge.Get(path);
						var str1 = '★★★★★☆☆☆☆☆';
						for (var i = 6; i--;) {
							api.InsertMenu(mii.hSubMenu, 0, MF_BYPOSITION | MF_STRING | (s == i ? MF_CHECKED : 0), ++nPos, ["&" + i, " - ", str1.substr(5 - i, 5)].join(""));
							ExtraMenuCommand[nPos] = Addons.Badge["Set" + i];
							api.InsertMenu(mii2.hSubMenu, 0, MF_BYPOSITION | MF_STRING , ++nPos, i ? ["&" + i, " - ", str1.substr(5 - i, 5)].join("") : GetText("All"));
							ExtraMenuCommand[nPos] = Addons.Badge["Open" + i];
						}
						api.InsertMenu(mii.hSubMenu, MAXINT, MF_BYPOSITION | MF_SEPARATOR, 0, null);
						api.InsertMenuItem(mii.hSubMenu, MAXINT, true, mii2);
						api.InsertMenu(mii.hSubMenu, MAXINT, MF_BYPOSITION | MF_SEPARATOR, 0, null);
						if (s && Selected.Count == 1) {
							api.InsertMenu(mii.hSubMenu, MAXINT, MF_BYPOSITION | MF_STRING, ++nPos, GetText("Path"));
							ExtraMenuCommand[nPos] = Addons.Badge.EditPath;
						}
					}
				}

				if (WINVER >= 0x600) {
					api.InsertMenu(mii.hSubMenu, MAXINT, MF_BYPOSITION | MF_STRING, ++nPos, api.LoadString(hShell32, 50690));
					ExtraMenuCommand[nPos] = Addons.Badge.Sort;
				}

				api.InsertMenuItem(hMenu, Addons.Badge.nPos, true, mii);
			}
			return nPos;
		});
	}
	//Image
	var hdc;
	for (var i = 6; --i;) {
		var image = te.WICBitmap();
		var s = api.PathUnquoteSpaces(ExtractMacro(te, item.getAttribute("Img"+ i)));
		if (s) {
			Addons.Badge.Image[i] = image.FromFile(s);
			if (Addons.Badge.Image[i]) {
				continue;
			}
		}
		hdc = api.GetDC(te.hwnd);
		var rc = api.Memory("RECT");
		var w = 32 * screen.logicalYDPI / 96;
		rc.Right = w;
		rc.Bottom = w;
		var hbm = api.CreateCompatibleBitmap(hdc, w, w);
		var hmdc = api.CreateCompatibleDC(hdc);
		var hOld = api.SelectObject(hmdc, hbm);
		var brush = api.CreateSolidBrush(159 + i * 16);
		api.FillRect(hmdc, rc, brush);
		api.SetTextColor(hmdc, 0xffffff);
		api.SetBkMode(hmdc, 1);
		var lf = api.Memory("LOGFONT");
		lf.lfFaceName = "Arial Black",
		lf.lfHeight = -w;
		lf.lfWeight = 700;
		var hFont = CreateFont(lf);
		var hfontOld = api.SelectObject(hmdc, hFont);
		rc.Top = -w / 4;
		api.DrawText(hmdc, i, -1, rc, DT_CENTER);
		api.SelectObject(hmdc, hfontOld);
		api.DeleteObject(brush);
		api.DeleteDC(hmdc);
		api.SelectObject(hmdc, hOld);
		Addons.Badge.Image[i] = image.FromHBITMAP(hbm);
		api.DeleteObject(hbm);
	}
	if (hdc) {
		api.ReleaseDC(te.hwnd, hdc);
	}
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}