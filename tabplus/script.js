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
		ImgLock: MakeImgSrc("bitmap:ieframe.dll,545,13,2", 0, false, 13),
		ImgClose: MakeImgSrc("bitmap:ieframe.dll,545,13,1", 0, false, 13),
		ImgFolder: document.documentMode ? null : MakeImgSrc("icon:shell32.dll,3,16", 0, false, 16),
		ImgNet: MakeImgSrc("icon:shell32.dll,9,16", 0, false, 16),

		Arrange: function (Id)
		{
			var TC = te.Ctrl(CTRL_TC, Id);
			if (TC) {
				if (this.nCount[Id] != TC.Count) {
					clearTimeout(Addons.TabPlus.tids[Id]);
					delete Addons.TabPlus.tids[Id];
				}
			}
			if (!Addons.TabPlus.tids[Id]) {
				Addons.TabPlus.tids[Id] = setTimeout(function ()
				{
					Addons.TabPlus.Arrange2(Id);
				}, 10);
			}
		},

		Arrange2: function (Id)
		{
			Addons.TabPlus.tids[Id] = setTimeout(function ()
			{
				delete Addons.TabPlus.tids[Id];
			}, 500);
			var o = document.getElementById("tabplus_" + Id);
			if  (o) {
				var TC = te.Ctrl(CTRL_TC, Id);
				if (TC) {
					this.nIndex[Id] = TC.SelectedIndex;
					this.nCount[Id] = TC.Count;
					var s = ['<button style="width: 0px; border 0px; padding: 0px; margin: 0px; outline: 0px; position: absolute; left: -99999px"></button>'];
					for (var i = 0; i < this.nCount[Id]; i++) {
						this.Tab(s, TC, i);
					}
					if (this.opt.New) {
						s.push('<button class="tab" onclick="Addons.TabPlus.New(', Id, ');return false" hidefocus="true" title="', GetText("New Tab"), '" style="font-family: ', document.body.style.fontFamily, ';">+</button>');
					}
					try {
						var FocusedId = te.Ctrl(CTRL_TC).Id;
						if (Id == FocusedId) {
							this.SetActiveColor(Id);
						}
					} catch (e) {
					}
					o.innerHTML = s.join("").replace(/\$/g, Id);
					if (this.Drag.length) {
						if (api.GetKeyState(VK_LBUTTON) < 0) {
							this.Cursor("move");
						}
						else {
							this.Drag = [];
							this.Cursor("default");
						}
					}
					else {
						this.Cursor("default");
					}
				}
			}
		},

		SelectionChanged: function (Id)
		{
			var TC = te.Ctrl(CTRL_TC, Id);
			if (TC) {
				var o = document.getElementById("tabplus_" + Id + "_" + this.nIndex[Id]);
				if  (o) {
					o.className = "tab";
					var o = document.getElementById("tabplus_" + Id + "_" + TC.SelectedIndex);
					if  (o) {
						o.className = "activetab";
						this.nIndex[Id] = TC.SelectedIndex;
						clearTimeout(Addons.TabPlus.tids[Id]);
						delete Addons.TabPlus.tids[Id];
					}
				}
				Addons.TabPlus.Arrange(Id);
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
				FV.Navigate(HOME_PATH ? HOME_PATH : FV ? FV.FolderItem : HOME_PATH, SBSP_NEWBROWSER);
				TC.Move(TC.SelectedIndex, TC.Count - 1);
			}
		},

		Tab: function (s, TC, i)
		{
			var FV = TC.Item(i);
			if (FV) {
				var bActive = (i == TC.SelectedIndex);
				s.push('<button style="');
				for (var e in eventTE.GetTabColor) {
					var cl = eventTE.GetTabColor[e](FV);
					if (cl) {
						if (bActive) {
							s.push("background-color:", cl, ";");
							break;
						}
						if (document.documentMode >= 10) {
							s.push('background: linear-gradient(to bottom, #ffffff,', cl, ' 70%);');
							break;
						}
						s.push('filter: progid:DXImageTransform.Microsoft.gradient(GradientType=0,startcolorstr=#ffffff,endcolorstr=', cl, ');');
						break;
					}
				}
				var path = api.GetDisplayNameOf(FV, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
				s.push('font-family: ', document.body.style.fontFamily, '; margin: 0px; white-space: nowrap;');
				s.push('" id="tabplus_$_', i,'" title="', path,'" onmousemove="Addons.TabPlus.Move(this, $)" class="');
				s.push(bActive ? 'activetab' : 'tab');
				s.push('" hidefocus="true">');
				this.Tab2(s, FV, i, path, bActive);
				s.push('</button>');
			}
		},

		Tab2: function (s, FV, i, path, bActive)
		{
			s.push('<table><tr>');
			if (FV.Data.Lock) {
				s.push('<td style="padding-right: 3px"><img src="', this.ImgLock, '"></td>');
			}
			if (this.opt.Icon) {
				if (api.PathIsNetworkPath(path)) {
					path = this.ImgNet;
				}
				if (this.ImgFolder) {
					path = this.ImgFolder;
				}
				else {
					var info = api.Memory("SHFILEINFO");
					api.ShGetFileInfo(FV, 0, info, info.Size, SHGFI_ICON | SHGFI_SMALLICON | SHGFI_PIDL);
					var image = te.GdiplusBitmap;
					image.FromHICON(info.hIcon, api.GetSysColor(COLOR_BTNFACE));
					api.DestroyIcon(info.hIcon);
					path = image.DataURI("image/png");
				}
				if (path) {
					s.push('<td style="padding-right: 3px"><img src="', path, '"></td>');
				}
			}
			s.push('<td><div style="overflow: hidden;');
			s.push(this.opt.Fix ? 'width: ' + this.opt.Width + 'px">' : '">');
			if (FV.FolderItem) {
				s.push((FV.Title || FV.FolderItem.Name).replace(/</g, "&lt;"));
			}
			s.push('</div></td>');
			if (this.opt.Close && !FV.Data.Lock) {
				s.push('<td style="padding-left: 3px"><img class="button" src="', this.ImgClose, '" id="tabplus_', TC.Id, '_', i, 'x" title="', GetText("Close Tab"), '" onmouseover="MouseOver(this)" onmouseout="MouseOut()"></td>');
			}
			s.push('</tr></table>');
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
				if (n >= 0) {
					if (api.GetKeyState(VK_LBUTTON) < 0) {
						var o = document.getElementById('tabplus_' + Id + '_' + n + 'x');
						if (o && HitTest(o, this.pt)) {
							TC.Item(n).Close();
						}
						else {
							TC.SelectedIndex = n;
						}
						(function (Id, n) { setTimeout(function ()
						{
							if (api.GetKeyState(VK_LBUTTON) < 0) {
								var pt = api.Memory("POINT");
								api.GetCursorPos(pt);
								if (n == Addons.TabPlus.FromPt(Id, pt)) {
									Addons.TabPlus.Cursor("move");
									Addons.TabPlus.Drag = Addons.TabPlus.Click.slice(0);
								}
							}
						}, 500);}) (Id, n);
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
				var pt = api.Memory("POINT");
				api.GetCursorPos(pt);
				if (this.Button[Id] && this.Button[Id].match(/3/)) {
					GestureExec(TC, "Tabs", GetGestureKey() + this.Button[Id], pt);
					return false;
				}
				var nDrop = this.FromPt(Id, pt);
				if (nDrop < 0) {
					nDrop = TC.Count;
				}
				if (this.Drag.length && (this.Drag[0] != Id || this.Drag[1] != nDrop)) {
					te.Ctrl(CTRL_TC, this.Drag[0]).Move(this.Drag[1], nDrop, TC);
					this.Drop = [];
				}
				else {
					setTimeout(function () {
						TC.Selected.Focus();
					}, 100);
				}
				if (this.Drag.length) {
					this.Cursor("default");
					this.Drag = [];
				}
			}
			this.Click = [];
			return true;
		},

		Move: function (o, Id)
		{
			if (this.Drag.length) {
				if (api.GetKeyState(VK_LBUTTON) < 0) {
					this.Drop = [Id, o.id.replace(/^.*_\d+_/, '') - 0];
				}
				else {
					this.Cursor("default");
					this.Drag = [];
				}
			}
		},

		Cursor: function (s)
		{
			var cTC = te.Ctrls(CTRL_TC);
			for (var j = cTC.Count; j-- > 0;) {
				SetCursor(document.getElementById('tabplus_' + cTC[j].Id), s);
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
				TC.selectedIndex = i < 0 ? TC.Count - 1 : i < TC.Count ? i : 0;
			}
		},

		FromPt: function (Id, pt)
		{
			var TC = te.Ctrl(CTRL_TC, Id);
			if (TC) {
				for (var n = TC.Count; n-- > 0;) {
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
			for (var n = cTC.Count; n-- > 0;) {
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
		s.push(' onmousedown="return Addons.TabPlus.Down($)" onmouseup="return Addons.TabPlus.Up($)" onclick="return false;"></div>');

		SetAddon(null, (Addons.TabPlus.opt.Align ? "InnerBottom_" : "InnerTop_") + Ctrl.Id, s.join("").replace(/\$/g, Ctrl.Id));
	});

	AddEvent("HitTest", function (Ctrl, pt, flags)
	{
		if (Ctrl.Type == CTRL_TC) {
			return Addons.TabPlus.FromPt(Ctrl.Id, pt);
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
			Addons.TabPlus.SelectionChanged(Ctrl.Id);
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
		for (var i = attrs.length; i-- > 0;) {
			Addons.TabPlus.opt[attrs[i].name] = attrs[i].value;
		}
	}
	window.OpenMode = Addons.TabPlus.opt.NewTab ? SBSP_NEWBROWSER : SBSP_SAMEBROWSER;
}
