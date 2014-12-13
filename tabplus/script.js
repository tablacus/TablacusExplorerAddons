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
			delete Addons.TabPlus.tids[Id];
			var o = document.getElementById("tabplus_" + Id);
			if  (o) {
				var TC = te.Ctrl(CTRL_TC, Id);
				if (TC && TC.Visible) {
					Addons.TabPlus.tids[Id] = null;
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
					}
					catch (e) {
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

		SelectionChanged: function (TC, Id)
		{
			var i = TC.SelectedIndex;
			var o = document.getElementById("tabplus_" + Id + "_" + i);
			if  (o) {
				var s = [];
				Addons.TabPlus.Tab(s, TC, i)
				o.outerHTML = s.join("").replace(/\$/g, TC.Id);
				this.nIndex[Id] = i;
			}
			for (i = TC.Count; i--;) {
				o = document.getElementById("tabplus_" + Id + "_" + i);
				if (!o || api.strcmpi(api.GetDisplayNameOf(TC[i].FolderItem, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING), o.title)) {
					if (!Addons.TabPlus.tids[Id]) {
						Addons.TabPlus.Arrange(Id);
					}
					break;
				}
			}
			this.SetActiveColor(Id);
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
				s.push('<button ');
				var bActive = (i == TC.SelectedIndex);
				if (bActive) {
					s.push('draggable="true" ondragstart="return Addons.TabPlus.Start5(this)"');
				}
				s.push('ondragend="Addons.TabPlus.End5(this)" style="');
				var cl = RunEvent4("GetTabColor", FV);
				if (cl) {
					if (bActive) {
						s.push("background-color:", cl, ";");
					}
					else if (document.documentMode >= 10) {
						s.push('background: linear-gradient(to bottom, #ffffff,', cl, ' 70%);');
					}
					else {
						s.push('filter: progid:DXImageTransform.Microsoft.gradient(GradientType=0,startcolorstr=#ffffff,endcolorstr=', cl, ');');
					}
				}
				var path = api.GetDisplayNameOf(FV.FolderItem, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
				s.push('font-family: ', document.body.style.fontFamily, '; margin: 0px; white-space: nowrap;');
				s.push('" id="tabplus_$_', i,'" title="', path,'" onmousemove="Addons.TabPlus.Move(this, $)" class="');
				s.push(bActive ? 'activetab' : 'tab');
				s.push('" hidefocus="true"><table><tr>');
				try {
					if (FV.Data.Lock) {
						s.push('<td style="padding-right: 2px; vertical-align: middle"><img src="', this.ImgLock, '"></td>');
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
							s.push('<td style="padding-right: 3px; vertical-align: middle;"><img src="', path, '"></td>');
						}
					}
					s.push('<td style="vertical-align: middle;"><div style="overflow: hidden;');
					s.push(this.opt.Fix ? 'width: ' + this.opt.Width + 'px">' : '">');
					if (FV.FolderItem) {
						s.push(GetTabName(FV).replace(/</g, "&lt;"));
					}
					s.push('</div></td>');
					if (this.opt.Close && !FV.Data.Lock) {
						s.push('<td style="vertical-align: middle"><img class="button" src="', this.ImgClose, '" id="tabplus_', FV.Parent.Id, '_', i, 'x" title="', GetText("Close Tab"), '" onmouseover="MouseOver(this)" onmouseout="MouseOut()"></td>');
					}
				} catch (e) {
				}
				s.push('</tr></table></button>');
			}
		},

		Down: function (Id)
		{
			if (this.tidDrag) {
				clearTimeout(this.tidDrag);
				delete this.tidDrag;
			}
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
						(function (Id, n) { this.tidDrag = setTimeout(function ()
						{
							delete Addons.TabPlus.tidDrag;
							if (api.GetKeyState(VK_LBUTTON) < 0) {
								var pt = api.Memory("POINT");
								api.GetCursorPos(pt);
								if (n == Addons.TabPlus.FromPt(Id, pt)) {
									Addons.TabPlus.Cursor("move");
									Addons.TabPlus.Drag = Addons.TabPlus.Click.slice(0);
								}
							}
						}, 100);}) (Id, n);
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
					Addons.TabPlus.GestureExec(TC, Id, this.Button[Id], pt);
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

		GestureExec: function (TC, Id, s, pt)
		{
			if (TC) {
				if (TC.HitTest(pt, TCHT_ONITEM) < 0) {
					if (GestureExec(TC, "Tabs_Background", GetGestureKey() + s, pt) === S_OK) {;
						return;
					}
				}
				GestureExec(TC, "Tabs", GetGestureKey() + s, pt);
			}
		},

		DblClick: function (Id)
		{
			api.GetCursorPos(pt);
			var TC = te.Ctrl(CTRL_TC, Id);
			Addons.TabPlus.GestureExec(TC, Id, this.Button[Id] + this.Button[Id], pt);
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

		Start5: function (o)
		{
			if (api.GetKeyState(VK_LBUTTON) < 0) {
				event.dataTransfer.effectAllowed = 'move';
				event.dataTransfer.setData("text", o.title);
				this.Drag5 = o.id;
				return true;
			}
			return false;
		},

		End5: function (o)
		{
			this.Drag5 = null;
			this.Drag = [];
			this.Cursor("default");
		},

		Over5: function (o)
		{
			if (this.Drag5) {
				event.preventDefault();
			}
		},

		Drop5: function (o)
		{
			if (/^tabplus_(\d+)/.test(o.id)) {
				var Id = RegExp.$1;
				var TC = te.Ctrl(CTRL_TC, Id);
				if (TC) {
					var pt = api.Memory("POINT");
					api.GetCursorPos(pt);
					var nDrop = this.FromPt(Id, pt);
					if (nDrop < 0) {
						nDrop = TC.Count;
					}

					if (/^tabplus_(\d+)_(\d+)/.test(Addons.TabPlus.Drag5)) {
						if (RegExp.$1 != Id || RegExp.$2 != nDrop) {
							te.Ctrl(CTRL_TC, RegExp.$1).Move(RegExp.$2, nDrop, TC);
							this.Drop = [];
						}
					}
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
		s.push(' onmousedown="Addons.TabPlus.Down($)" onmouseup="return Addons.TabPlus.Up($)" onclick="return false;" ondragover="Addons.TabPlus.Over5(this)" ondrop="Addons.TabPlus.Drop5(this)"></div>');

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
		var FV = Ctrl.Selected;
		if (FV) {
			var o = document.getElementById('tabplus_' + Ctrl.Id + '_' + i);
			if (o) {
				var s = [];
				Addons.TabPlus.Tab(s, Ctrl, i)
				o.outerHTML = s.join("").replace(/\$/g, Ctrl.Id);
			}
		}
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
		if (Ctrl.Type == CTRL_WB && !Addons.TabPlus.Drag5) {
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
			Addons.TabPlus.SelectionChanged(Ctrl, Ctrl.Id);
		}
	});

	AddEvent("ChangeView", function (Ctrl)
	{
		var TC = Ctrl.Parent;
		if (TC) {
			var i = Addons.TabPlus.nIndex[TC.Id];
			var o = document.getElementById("tabplus_" + TC.Id + "_" + i);
			if  (o) {
				var s = [];
				Addons.TabPlus.Tab(s, TC, i)
				o.outerHTML = s.join("").replace(/\$/g, TC.Id);
			}
			else if (!Addons.TabPlus.tids[TC.Id] && TC.Visible) {
				if (Addons.TabPlus.tids[TC.Id] === null) {
					Addons.TabPlus.tids[TC.Id] = setTimeout(function () {
						Addons.TabPlus.Arrange(TC.Id);
					}, 500);
				}
				else {
					Addons.TabPlus.Arrange(TC.Id);
				}
			}
		}
	});

	AddEvent("Create", function (Ctrl)
	{
		if (Ctrl.Type == CTRL_TC) {
			if (!Addons.TabPlus.tids[Ctrl.Id]) {
				Addons.TabPlus.tids[Ctrl.Id] = setTimeout(function () {
					Addons.TabPlus.Arrange(Ctrl.Id);
				}, 500);
			}
		}
	});

	AddEvent("CloseView", function (Ctrl)
	{
		var TC = Ctrl.Parent;
		if (TC) {
			if (!Addons.TabPlus.tids[TC.Id]) {
				Addons.TabPlus.tids[TC.Id] = setTimeout(function () {
					Addons.TabPlus.Arrange(TC.Id);
				}, 500);
			}
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
