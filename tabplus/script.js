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
		tidResize: null,
		tidCursor: null,

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
					var tabs = o.getElementsByTagName("li");
					if (TC.Count + (this.opt.New ? 1 : 0) != tabs.length) {
						var s = [];
						for (var i = 0; i < this.nCount[Id]; i++) {
							this.Tab(s, TC, i);
						}
						if (this.opt.New) {
							s.push('<li class="tab3" onclick="Addons.TabPlus.New(', Id, ');return false" title="', GetText("New Tab"), '" style="font-family: ', document.body.style.fontFamily);
							if (this.opt.Align > 1 && this.opt.Width) {
								s.push('; text-align: center; width: 100%');
							}
							s.push('" />+</li>');
						}
						o.innerHTML = s.join("").replace(/\$/g, Id);
					}
					try {
						var FocusedId = te.Ctrl(CTRL_TC).Id;
						if (Id == FocusedId) {
							this.SetActiveColor(Id);
						}
					} catch (e) {}
					for (var i = this.nCount[Id]; i--;) {
						this.Style(TC, i);
					}
					if (this.Drag.length) {
						if (api.GetKeyState(VK_LBUTTON) < 0) {
							this.Cursor2("move");
						} else {
							this.Drag = [];
							this.Cursor("default");
						}
					} else {
						this.Cursor("default");
					}
				}
			}
		},

		SelectionChanged: function (TC, Id)
		{
			if (TC.Type = CTRL_TC && TC.Visible && !Addons.TabPlus.tids[TC.Id]) {
				Addons.TabPlus.tids[TC.Id] = setTimeout(function () {
					Addons.TabPlus.Arrange(TC.Id);
				}, 99);
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
				s.push('<li id="tabplus_$_', i,'"  style="font-family: ', document.body.style.fontFamily, '" ');
				s.push('draggable="true" ondragstart="return Addons.TabPlus.Start5(this)" ondragend="Addons.TabPlus.End5(this)" onfocus="this.blur()" onmousemove="Addons.TabPlus.Move(this, $)"></li>');
			}
		},

		Style: function (TC, i)
		{
			var FV = TC.Item(i);
			var o = document.getElementById("tabplus_" + TC.Id + "_" + i);
			if (FV && o) {
				var path = api.GetDisplayNameOf(FV.FolderItem, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
				o.title = path;
				var s = ['<table><tr>'];
				try {
					var w = FV.Data.Lock || this.opt.Close ? -13 : 0;
					if (FV.Data.Lock) {
						s.push('<td style="padding-right: 2px; vertical-align: middle"><img src="', this.ImgLock, '" style="width: 13px"></td>');
						w -= 2;
					}
					if (this.opt.Icon) {
						path = GetIconImage(FV, api.GetSysColor(COLOR_BTNFACE));
						if (path) {
							s.push('<td style="padding-right: 3px; vertical-align: middle;"><img src="', path, '"></td>');
							w -= 20;
						}
					}
					s.push('<td style="vertical-align: middle;"><div style="overflow: hidden; white-space: nowrap; text-overflow: ellipsis;');
					w += Number(this.opt.Width) || 0;
					if (w >= 0) {
						s.push((this.opt.Fix ? 'width: ' : 'max-width:'), w, 'px');
					}
					var n = "";
					if (FV.FolderItem) {
						n = GetTabName(FV).replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
						if (this.opt.Tooltips) {
							s.push('" title="', FV.FolderItem.Path.replace(/"/g, "&quot;"));
						}
					}
					s.push('" >', n.replace(/</g, "&lt;"), '</div></td>');
					if (this.opt.Close && !FV.Data.Lock) {
						s.push('<td style="vertical-align: middle; width: 13px" align="right"><img class="button" src="', this.ImgClose, '" style="width: 13px" id="tabplus_', FV.Parent.Id, '_', i, 'x" title="', GetText("Close Tab"), '" onmouseover="MouseOver(this)" onmouseout="MouseOut()"></td>');
					}
				} catch (e) {}
				s.push('</tr></table>');
				o.innerHTML = s.join("");
				var style = o.style;
				var cl = RunEvent4("GetTabColor", FV);
				if (cl) {
					if (i == TC.SelectedIndex) {
						if (document.documentMode >= 10) {
							style.background = "";
						} else {
							style.filter = "";
						}
						style.backgroundColor = cl;
					} else if (document.documentMode >= 10) {
						style.background = "linear-gradient(to bottom, #ffffff," + cl + " 70%)";
					} else {
						style.filter = 'progid:DXImageTransform.Microsoft.gradient(GradientType=0,startcolorstr=#ffffff,endcolorstr=' + cl + ')';
					}
					cl = api.sscanf(cl, "#%06x") 
					cl = (cl & 0xff0000) * .0045623779296875 + (cl & 0xff00) * 2.29296875 + (cl & 0xff) * 114;
					style.color = cl > 127000 ? "black" : "white";
				} else {
					if (document.documentMode >= 10) {
						style.background = "";
					} else if (style.filter) {
						style.filter = "";
					}
					style.color = "";
					style.backgroundColor = "";
				}
				if (i == TC.SelectedIndex) {
					o.className = 'activetab';
					style.zIndex = TC.Count + 1;
				} else {
					o.className = i < TC.SelectedIndex ? 'tab' : 'tab2';
					style.zIndex = TC.Count - i;
				}
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
						} else {
							TC.SelectedIndex = n;
						}
						(function (Id, n) { this.tidDrag = setTimeout(function ()
						{
							delete Addons.TabPlus.tidDrag;
							if (api.GetKeyState(VK_LBUTTON) < 0) {
								var pt = api.Memory("POINT");
								api.GetCursorPos(pt);
								if (n == Addons.TabPlus.FromPt(Id, pt)) {
									Addons.TabPlus.Cursor2("move");
									Addons.TabPlus.Drag = Addons.TabPlus.Click.slice(0);
								}
							}
						}, 99);}) (Id, n);
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
				if (this.Button[Id] && /3/.test(this.Button[Id])) {
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
				} else {
					setTimeout(function () {
						TC.Selected.Focus();
					}, 99);
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
				} else {
					this.Cursor("default");
					this.Drag = [];
				}
			}
		},

		Cursor: function (s)
		{
			clearTimeout(Addons.TabPlus.tidCursor);
			var cTC = te.Ctrls(CTRL_TC);
			for (var j in cTC) {
				if (cTC[j].Visible) {
					SetCursor(document.getElementById('tabplus_' + cTC[j].Id), s);
				}
			}
		},

		Cursor2: function (s)
		{
			this.tidCursor = setTimeout(function ()
			{
				Addons.TabPlus.Cursor(s)
			}, 500);
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
				clearTimeout(Addons.TabPlus.tidCursor);
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
				if (event.preventDefault) {
					event.preventDefault();
				} else {
		 			event.returnValue = false;
				}
			}
		},

		Drop5: function (o)
		{
			var res = /^tabplus_(\d+)/.exec(o.id);
			if (res) {
				var Id = res[1];
				var TC = te.Ctrl(CTRL_TC, Id);
				if (TC) {
					var pt = api.Memory("POINT");
					api.GetCursorPos(pt);
					var nDrop = this.FromPt(Id, pt);
					if (nDrop < 0) {
						nDrop = TC.Count;
					}
					res = /^tabplus_(\d+)_(\d+)/.exec(Addons.TabPlus.Drag5);
					if (res) {
						if (res[1] != Id || res[2] != nDrop) {
							te.Ctrl(CTRL_TC, res[1]).Move(res[2], nDrop, TC);
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
				var o = document.getElementById("tabplus_" + Id);
				if (o.clientWidth == o.offsetWidth) {
					var i = TC.selectedIndex + (event.wheelDelta > 0 ? -1 : 1);
					TC.selectedIndex = i < 0 ? TC.Count - 1 : i < TC.Count ? i : 0;
				}
			}
		},

		FromPt: function (Id, pt)
		{
			var ptc = pt.Clone();
			api.ScreenToClient(api.GetWindow(document), ptc);
			var elem = document.elementFromPoint(ptc.x, ptc.y);
			var re = new RegExp("tabplus_" + Id + "_(\\d+)", "");
			while (elem && !/UL/i.test(elem.tagName)) {
				var res = re.exec(elem.id);
				if (res) {
					return res[1];
				}
				elem = elem.parentElement;
			}
			return -1;
		},

		TCFromPt: function (pt)
		{
			var cTC = te.Ctrls(CTRL_TC);
			for (var n in cTC) {
				var TC = cTC[n];
				if (TC.Visible) {
					if (HitTest(document.getElementById("tabplus_" + TC.Id), pt)) {
						return TC;
					}
				}
			}
		},

		Resize: function (TC)
		{
			if (this.opt.Align > 1 && !this.tidResize) {
				this.tidResize = setTimeout(function ()
				{
					Addons.TabPlus.tidResize = null;
					var cTC = te.Ctrls(CTRL_TC);
					for (var j in cTC) {
						var TC = cTC[j];
						if (TC.Visible) {
							var id = TC.Id;
							var o = document.getElementById("Panel_" + id);
							if (o) {
								document.getElementById("tabplus_" + id).style.height = o.clientHeight + "px";
							}
						}
					}
				}, 500);
			}
		}
	};

	AddEvent("PanelCreated", function (Ctrl)
	{
		var s = ['<ul id="tabplus_$" class="tab0" oncontextmenu="Addons.TabPlus.Popup($);return false"'];
		s.push(' ondblclick="Addons.TabPlus.DblClick($);return false" onmousewheel="Addons.TabPlus.Wheel($)" onresize="Resize();"');
		s.push(' onmousedown="Addons.TabPlus.Down($)" onmouseup="return Addons.TabPlus.Up($)" onclick="return false;" ondragover="Addons.TabPlus.Over5(this)" ondrop="Addons.TabPlus.Drop5(this)" style="width: 100%"></ul>');
		var n = Addons.TabPlus.opt.Align || 0;
		var arAlign = ["InnerTop_", "InnerBottom_", "InnerLeft_", "InnerRight_"];
		var o = document.getElementById(SetAddon(null, arAlign[n] + Ctrl.Id, s.join("").replace(/\$/g, Ctrl.Id)));
		if (n > 1) {
			var h = o.innerHeight;
			var w = (Number(Addons.TabPlus.opt.Width || 84) + 17) + "px";
			o.style.width = w;
			o = document.getElementById("tabplus_" + Ctrl.Id);
			o.style.width = w;
			o.style.height = "0";
			o.style.overflow = "auto";
		} else {
			o.style.overflow = "hidden";
		}
		o.style.overflowX = "hidden";
	});

	AddEvent("HitTest", function (Ctrl, pt, flags)
	{
		if (Ctrl.Type == CTRL_TC) {
			return Addons.TabPlus.FromPt(Ctrl.Id, pt);
		}
	});

	AddEvent("Lock", function (Ctrl, i, bLock)
	{
		Addons.TabPlus.Style(Ctrl, i)
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
					pdwEffect[0] = DROPEFFECT_NONE;
					return S_OK;
				} else if (dataObj.Item(0) && dataObj.Item(0).IsFolder) {
					pdwEffect[0] = DROPEFFECT_LINK;
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
					var hr = S_FALSE;
					var DropTarget = TC.Item(nIndex).DropTarget;
					if (DropTarget) {
						clearTimeout(Addons.TabPlus.tid);
						hr = DropTarget.Drop(dataObj, grfKeyState, pt, pdwEffect);
					}
					return hr;
				} else if (dataObj.Count) {
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
			Addons.TabPlus.Resize();
		}
	});

	AddEvent("SelectionChanged", function (Ctrl)
	{
		if (Ctrl.Type == CTRL_TC) {
			Addons.TabPlus.Arrange(Ctrl.Id);
		}
	});

	AddEvent("ChangeView", function (Ctrl)
	{
		var TC = Ctrl.Parent;
		if (TC) {
			var i = Addons.TabPlus.nIndex[TC.Id];
			var o = document.getElementById("tabplus_" + TC.Id + "_" + i);
			if  (o) {
				Addons.TabPlus.Style(TC, i)
				var o = document.getElementById("tabplus_" + TC.Id);
				if (o) {
					var tabs = o.getElementsByTagName("li");
					if (TC.Count + (Addons.TabPlus.opt.New ? 1 : 0) != tabs.length) {
						o = null;
					}
				}
			}
			if (!o) {
				Addons.TabPlus.SelectionChanged(TC, TC.Id);
			}
		}
	});

	AddEvent("Create", function (Ctrl)
	{
		Addons.TabPlus.SelectionChanged(Ctrl, Ctrl.Id);
	});

	AddEvent("CloseView", function (Ctrl)
	{
		var TC = Ctrl.Parent;
		if (TC) {
			Addons.TabPlus.SelectionChanged(TC, TC.Id);
		}
	});

	AddEvent("Resize", function ()
	{
		Addons.TabPlus.Resize();
	});

	AddEvent("MouseMessage", function (Ctrl, hwnd, msg, mouseData, pt, wHitTestCode, dwExtraInfo)
	{
		if (msg == WM_MBUTTONDOWN || msg == WM_MBUTTONUP) {
			if (Ctrl.Type == CTRL_WB) {
				var TC = Addons.TabPlus.TCFromPt(pt);
				if (TC) {
					if (msg == WM_MBUTTONDOWN) {
						Addons.TabPlus.Down(TC.Id);
						Addons.TabPlus.Button[TC.Id] = GetGestureKey().replace(/3/, "") + "3";
					} else {
						Addons.TabPlus.Up(TC.Id);
					}
					return S_OK;
				}
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
		var s = item.getAttribute("IconLock");
		Addons.TabPlus.ImgLock = MakeImgSrc(s || "bitmap:ieframe.dll,545,13,2", 0, true, 13);
		s = item.getAttribute("IconClose");
		Addons.TabPlus.ImgClose = MakeImgSrc(s || "bitmap:ieframe.dll,545,13,1", 0, true, 13);
	}

	window.OpenMode = Addons.TabPlus.opt.NewTab ? SBSP_NEWBROWSER : SBSP_SAMEBROWSER;
}
