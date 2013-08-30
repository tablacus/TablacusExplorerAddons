(function () {
	var items = te.Data.Addons.getElementsByTagName("tabplus");
	if (items.length) {
		var item = items[0];
		if (!item.getAttribute("Set")) {
			item.setAttribute("Icon", 1);
			item.setAttribute("New", 1);
		}
	}
	if (window.Addon == 1) {
		Addons.TabPlus =
		{
			Click: [],
			Button: [],
			Drag: [],
			Drop: [],
			pt: api.Memory("POINT"),
			nCount: [],
			nIndex: [],
			bFlag: [],
			nFocused: -1,
			opt: [],
			tids: [],

			Arrange: function (Id)
			{
				if (!Addons.TabPlus.tids[Id]) {
					Addons.TabPlus.tids[Id] = setTimeout(function ()
					{
						Addons.TabPlus.Arrange2(Id);
					}, 100);
				}
			},

			Arrange2: function (Id)
			{
				delete Addons.TabPlus.tids[Id];
				var o = document.getElementById("tabplus_" + Id);
				if  (o) {
					var TC = te.Ctrl(CTRL_TC, Id);
					if (TC) {
						this.nIndex[Id] = TC.SeletedIndex;
						this.nCount[Id] = TC.Count;
						var s = [];
						for (var i = 0; i < this.nCount[Id]; i++) {
							this.Tab(s, TC, i);
						}
						if (this.opt.New) {
							s.push('<button class="tab" onclick="Addons.TabPlus.New(' + Id + ');return false" hidefocus="true" title="' + GetText("New Tab") + '" style="font-family: ' + document.body.style.fontFamily + ';">+</button>');
						}
						try {
							var FocusedId = te.Ctrl(CTRL_TC).Id;
							if (Id == FocusedId) {
								this.SetActiveColor(Id);
							}
						} catch (e) {
						}
						o.innerHTML = s.join("").replace(/\$/g, Id);
						SetCursor(o, "default");
					}
				}
			},

			SetActiveColor: function (Id, s)
			{
				this.SetActiveColor2(this.nFocused, "");
				if (this.opt.Active) {
					this.SetActiveColor2(Id, "ActiveCaption");
					this.nFocused = Id;
				}
			},

			SetActiveColor2: function (Id, s)
			{
				var o = document.getElementById("Panel_" + Id);
				if  (o) {
					o.style.backgroundColor = s;
				}
			},

			New: function (Id)
			{
				var TC = te.Ctrl(CTRL_TC, Id);
				if (TC) {
					var FV = TC.Selected;
					FV.Navigate(FV ? FV.FolderItem : 0, SBSP_NEWBROWSER);
					TC.Move(TC.SelectedIndex, TC.Count - 1);
				}
			},

			Tab: function (s, TC, i)
			{
				var FV = TC.Item(i);
				if (FV) {
					var bActive = (i == TC.SelectedIndex);
					s.push('<button style="border: 1px solid #898C95;');
					for (var e in eventTE.GetTabColor) {
						var cl = eventTE.GetTabColor[e](FV);
						if (cl) {
							if (bActive) {
								s.push('background-color: ' + cl);
								break;
							}
							if (document.documentMode >= 10) {
								s.push('background: linear-gradient(to bottom, ' + cl + ', #cccccc);');
								break;
							}
							s.push('filter: progid:DXImageTransform.Microsoft.gradient(GradientType=0,startcolorstr=' + cl + ',endcolorstr=#cccccc)');
							break;
						}
					}
					s.push('; font-family: ' + document.body.style.fontFamily + '; margin: 0px; white-space: nowrap;');
					s.push('" id="tabplus_$_' + i);
					s.push('" title="');
					s.push(api.GetDisplayNameOf(FV.FolderItem, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING));
					s.push('" onmousemove="Addons.TabPlus.Move(this, $)"');
					s.push('class="');
					s.push(bActive ? 'activetab' : 'tab');
					s.push('" hidefocus="true"><table><tr>');
					if (FV.Data.Lock) {
						s.push('<td style="padding-right: 3px"><img src="' + this.ImgLock + '"></td>');
					}
					if (this.opt.Icon && document.documentMode) {
						var info = api.Memory("SHFILEINFO");
						api.ShGetFileInfo(FV.FolderItem, 0, info, info.Size, SHGFI_ICON | SHGFI_SMALLICON | SHGFI_OPENICON | SHGFI_PIDL);
						var image = te.GdiplusBitmap;
						image.FromHICON(info.hIcon, api.GetSysColor(COLOR_BTNFACE));
						api.DestroyIcon(info.hIcon);
						s.push('<td style="padding-right: 3px"><img src="' + image.DataURI("image/png") + '"></td>');
					}
					s.push('<td><div style="overflow: hidden;');
					s.push(this.opt.Fix ? 'width: ' + this.opt.Width + 'px">' : '">');
					if (FV.FolderItem) {
						s.push((FV.Title || FV.FolderItem.Name).replace(/</g, "&lt;"));
					}
					s.push('</div></td>');
					if (this.opt.Close && !FV.Data.Lock) {
						s.push('<td style="padding-left: 3px"><img class="button" src="' + this.ImgClose + '" id="tabplus_' + TC.Id + '_' + i + 'x" title="' + GetText("Close Tab") + '" onmouseover="MouseOver(this)" onmouseout="MouseOut()"></td>');
					}
					s.push('</tr></table></button>');
				}
			},

			Down: function (Id)
			{
				var TC = te.Ctrl(CTRL_TC, Id);
				if (TC) {
					api.GetCursorPos(this.pt);
					var n = this.FromPt(Id, this.pt);
					this.Click = [Id, n];
					this.Drag = [];
					this.Button[Id] = GetGestureButton();
					this.DragTime = new Date().getTime();
					if (n >= 0) {
						if (api.GetKeyState(VK_LBUTTON) < 0) {
							var o = document.getElementById('tabplus_' + Id + '_' + n + 'x');
							if (o && HitTest(o, this.pt)) {
								TC.Item(n).Close();
							}
							else {
								TC.SelectedIndex = n;
							}
							return false;
						}
					}
				}
				return true;
			},

			Up: function (Id)
			{
				var TC = te.Ctrl(CTRL_TC, Id);
				if (TC) {
					if (this.Button[Id] && this.Button[Id].match(/3/)) {
						GestureExec(TC, "Tabs", GetGestureKey() + this.Button[Id], pt);
						return false;
					}
					var pt = api.Memory("POINT");
					api.GetCursorPos(pt);
					var nDrop = this.FromPt(Id, pt);
					if (nDrop < 0) {
						nDrop = TC.Count;
					}
					if (this.Drag.length && (new Date().getTime() - this.DragTime > 500) && (this.Drag[0] != Id || this.Drag[1] != nDrop)) {
						te.Ctrl(CTRL_TC, this.Drag[0]).Move(this.Drag[1], nDrop, TC);
						this.Drop = [];
						this.Arrange(Id);
					}
					else {
						(function (TC) { setTimeout(function () {
							TC.Selected.Focus();
						}, 100);}) (TC);
					}
					this.Cursor("default");
					this.Drag = [];
				}
				this.Click = [];
				return true;
			},

			Move: function (o, Id)
			{
				if (api.GetKeyState(VK_LBUTTON) < 0) {
					this.Drop = [Id, o.id.replace(/^.*_\d+_/, '') - 0];
					if (!isFinite(this.Drag[1])) {
						if (this.Click[1] == this.Drop[1]) {
							var pt = api.Memory("POINT");
							api.GetCursorPos(pt);
							if (IsDrag(pt, Addons.TabPlus.pt)) {
								this.Drag = this.Click.slice(0);
								this.Cursor("move");
							}
						}
					}
				}
				else if (isFinite(this.Drag[1])) {
					this.Cursor("default");
					this.Drag = [];
				}
			},

			Cursor: function (s)
			{
				var cTC = te.Ctrls(CTRL_TC);
				for (var j = cTC.Count - 1; j >= 0; j--) {
					var Id = cTC.Item(j).Id;
					SetCursor(document.getElementById('tabplus_' + Id), s);
				}
			},

			Popup: function (Id)
			{
				var pt = api.Memory("POINT");
				api.GetCursorPos(pt);
				var TC = te.Ctrl(CTRL_TC, Id);
				if (TC) {
					var ShowContextMenu = te.OnShowContextMenu;
					ShowContextMenu(TC, TC.hwnd, WM_CONTEXTMENU, 0, pt);
				}
			},

			DblClick: function (Id)
			{
				GestureExec(te.Ctrl(CTRL_TC, Id), "Tabs", GetGestureKey() + this.Button[Id] + this.Button[Id]);
			},

			Over: function (Id)
			{
				var pt = api.Memory("POINT");
				api.GetCursorPos(pt);
				if (!IsDrag(pt, g_ptDrag)) {
					var nIndex = this.FromPt(Id, pt);
					if (nIndex >= 0) {
						te.Ctrl(CTRL_TC, Id).SelectedIndex = nIndex;
					}
				}
			},

			Wheel: function (Id)
			{
				var TC = te.Ctrl(CTRL_TC, Id);
				if (TC) {
					var i = TC.selectedIndex + (event.wheelDelta > 0 ? -1 : 1);
					if (i < 0) {
						TC.selectedIndex = TC.Count - 1;
					}
					else if (i >= TC.Count) {
						TC.selectedIndex = 0;
					}
					else {
						TC.selectedIndex = i;
					}
				}
			},

			FromPt: function (Id, pt)
			{
				var TC = te.Ctrl(CTRL_TC, Id);
				if (TC) {
					var n = TC.Count;
					while (--n >= 0) {
						if (HitTest(document.getElementById("tabplus_" + Id + "_" + n), pt)) {
							return n;
						}
					}
				}
				return -1;
			},

			TCFromPt: function (pt)
			{
				var cTC = te.Ctrls(CTRL_TC);
				var n = cTC.Count;
				while (--n >= 0) {
					var TC = cTC.Item(n);
					if (TC.Visible) {
						if (HitTest(document.getElementById("tabplus_" + TC.Id), pt)) {
							return TC;
						}
					}
				}
			}

		};

		AddEvent("PanelCreated", function (Ctrl)
		{
			var s = ['<div id="tabplus_$" oncontextmenu="Addons.TabPlus.Popup($);return false"'];
			s.push(' ondblclick="Addons.TabPlus.DblClick($);return false" onmousewheel="Addons.TabPlus.Wheel($)" onresize="Resize();"');
			s.push(' onmousedown="return Addons.TabPlus.Down($)" onmouseup="return Addons.TabPlus.Up($)"></div>');

			SetAddon(null, (Addons.TabPlus.opt.Align ? "InnerBottom_" : "InnerTop_") + Ctrl.Id, s.join("").replace(/\$/g, Ctrl.Id));
		});

		AddEvent("HitTest", function (Ctrl, pt, flags)
		{
			if (Ctrl.Type == CTRL_TC) {
				var i = Addons.TabPlus.FromPt(Ctrl.Id, pt);
				if (i >= 0) {
					return i;
				}
			}
		});

		AddEvent("Lock", function (Ctrl, i, bLock)
		{
			Addons.TabPlus.Arrange(Ctrl.Id);
		});

		AddEvent("DragEnter", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
		{
			if (Ctrl.Type == CTRL_WB) {
				return S_OK;
			}
		});

		AddEvent("DragOver", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
		{
			if (Ctrl.Type == CTRL_WB) {
				var TC = Addons.TabPlus.TCFromPt(pt);
				if (TC) {
					var nIndex = Addons.TabPlus.FromPt(TC.Id, pt);
					if (nIndex >= 0) {
						if (dataObj.Count) {
							if (IsDrag(pt, g_ptDrag)) {
								clearTimeout(Addons.TabPlus.tid);
								g_ptDrag = pt.Clone();
								Addons.TabPlus.tid = setTimeout("Addons.TabPlus.Over(" + TC.Id + ");" , 300);
							}
							var Target = TC.Item(nIndex).FolderItem;
							if (!api.ILIsEqual(dataObj.Item(-1), Target)) {
								var DropTarget = api.DropTarget(Target);
								if (DropTarget) {
									return DropTarget.DragOver(dataObj, grfKeyState, pt, pdwEffect);
								}
							}
						}
						pdwEffect.X = DROPEFFECT_NONE;
						return S_OK;
					}
					else if (dataObj.Item(0) && dataObj.Item(0).IsFolder) {
						pdwEffect.X = DROPEFFECT_LINK;
						return S_OK;
					}
				}
			}
		});

		AddEvent("Drop", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
		{
			if (Ctrl.Type == CTRL_WB) {
				var TC = Addons.TabPlus.TCFromPt(pt);
				if (TC) {
					var nIndex = Addons.TabPlus.FromPt(TC.Id, pt);
					if (nIndex >= 0) {
						TC.SelectedIndex = nIndex;
						var DropTarget = TC.Item(nIndex).DropTarget;
						if (DropTarget) {
							return DropTarget.Drop(dataObj, grfKeyState, pt, pdwEffect);
						}
					}
					else if (dataObj.Count) {
						for (var i = 0; i < dataObj.Count; i++) {
							var FV = TC.Selected.Navigate(dataObj.Item(i), SBSP_NEWBROWSER | SBSP_ACTIVATE_NOFOCUS);
							TC.Move(FV.Index, TC.Count - 1);
						}
					}
				}
			}
		});

		AddEvent("Dragleave", function (Ctrl)
		{
			clearTimeout(Addons.TabPlus.tid);
			Addons.TabPlus.tid = null;
			return S_OK;
		});

		AddEvent("VisibleChanged", function (Ctrl)
		{
			if (Ctrl.Type == CTRL_TC) {
				if (Ctrl.Visible) {
					Addons.TabPlus.SetActiveColor(Ctrl.Id);
				}
			}
		});

		AddEvent("SelectionChanged", function (Ctrl)
		{
			if (Ctrl.Type == CTRL_TC) {
				Addons.TabPlus.Arrange(Ctrl.Id);
			}
		});

		AddEvent("Arrange", function (Ctrl)
		{
			if (Ctrl.Type == CTRL_TC) {
				Addons.TabPlus.Arrange(Ctrl.Id);
			}
		});

		AddEvent("ChangeView", function (Ctrl)
		{
			var FV = Ctrl.Parent;
			if (FV) {
				Addons.TabPlus.Arrange(FV.Id);
			}
		});

		//Init
		te.Tab = false;
		if (items.length) {
			var attrs = item.attributes;
			for(var i = attrs.length - 1; i >= 0; i--) {
				Addons.TabPlus.opt[attrs[i].name] = attrs[i].value;
			}
		}
		window.OpenMode = Addons.TabPlus.opt.NewTab ? SBSP_NEWBROWSER : SBSP_SAMEBROWSER;

		if (document.documentMode) {
			var system32 = api.GetDisplayNameOf(ssfSYSTEM, SHGDN_FORPARSING | SHGDN_FORADDRESSBAR);
			var hModule = api.LoadLibraryEx(fso.BuildPath(system32, "ieframe.dll"), 0, LOAD_LIBRARY_AS_DATAFILE) || api.LoadLibraryEx(fso.BuildPath(system32, "browseui.dll"), 0, LOAD_LIBRARY_AS_DATAFILE);
			if (hModule) {
				var himl = api.ImageList_LoadImage(hModule, 545, 13, 0, CLR_DEFAULT, IMAGE_BITMAP, LR_CREATEDIBSECTION);

				if (himl) {
					var hIcon = api.ImageList_GetIcon(himl, 2, ILD_NORMAL);
					if (hIcon) {
						var image = external.GdiplusBitmap;
						image.FromHICON(hIcon, api.GetSysColor(COLOR_BTNFACE));
						Addons.TabPlus.ImgLock = image.DataURI("image/png");
						api.DestroyIcon(hIcon);
						hIcon = api.ImageList_GetIcon(himl, 1, ILD_NORMAL);
						if (hIcon) {
							image.FromHICON(hIcon, api.GetSysColor(COLOR_BTNFACE));
							Addons.TabPlus.ImgClose = image.DataURI("image/png");
							api.DestroyIcon(hIcon);
						}
					}
					api.ImageList_Destroy(himl);
				}
				api.FreeLibrary(hModule);
			}
		}
	}
})();
