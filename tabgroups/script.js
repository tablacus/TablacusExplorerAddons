var Addon_Id = "tabgroups";
var Default = "ToolBar5Center";

if (window.Addon == 1) {
	Addons.Tabgroups =
	{
		Name: null,
		nDrag: 0,
		nDrop: 0,
		WheelButton: 0,
		tid: null,
		pt: api.Memory("POINT"),
		bTab: !GetAddonOptionEx("tabgroups", "Mode"),

		Init: function ()
		{
			SetAddon(Addon_Id, Default, ['<ul class="', Addons.Tabgroups.bTab ? "tab0" : "menu0", '" id="tabgroups"><li> </li></ul>']);
			if (!te.Data.Tabgroups) {
				te.Data.Tabgroups = te.Object();
				te.Data.Tabgroups.Data = te.Array();
				te.Data.Tabgroups.Index = 1;
			}

			setTimeout(function ()
			{
				if (!te.Data.Tabgroups.Click) {
					Addons.Tabgroups.LoadWindow(OpenXml("window.xml", true, false));
				}
			}, 999);
		},

		LoadWindow: function (xml)
		{
			var items = xml ? xml.getElementsByTagName("Group") : {};
			if (items.length) {
				te.Data.Tabgroups.Click = items.length ? items[0].getAttribute("Index") : 1;
				items = items[0].getElementsByTagName("Item");
			} else {
				xml = OpenXml("tabgroups.xml", true, true);
				items = xml.getElementsByTagName("Index");
				te.Data.Tabgroups.Click = items.length ? items[0].text : 1;
				items = xml.getElementsByTagName("Item");
				Addons.Tabgroups.DeleteOldXml = items.length;
			}
			if (items.length) {
				te.Data.Tabgroups.Data = te.Array();
				for (i = 0; i < items.length; i++) {
					Addons.Tabgroups.New(items[i].getAttribute("Name"), items[i].getAttribute("Color"), items[i].getAttribute("Lock"));
				}
			}
			if (!te.Data.Tabgroups.Data.length) {
				Addons.Tabgroups.Add();
			}
			Addons.Tabgroups.Arrange(true);
		},

		Load: function ()
		{
			var commdlg = api.CreateObject("CommonDialog");
			commdlg.InitDir = fso.BuildPath(te.Data.DataFolder, "layout");
			commdlg.Filter = MakeCommDlgFilter("*.xml");
			commdlg.Flags = OFN_FILEMUSTEXIST;
			if (commdlg.ShowOpen()) {
				var fn = api.PathUnquoteSpaces(commdlg.filename);
				if (fso.FileExists(fn)) {
					xml = te.CreateObject("Msxml2.DOMDocument");
					xml.async = false;
					xml.load(fn);
				}
				var items = xml.getElementsByTagName("Group");
				if (items.length) {
					var items = items[0].getElementsByTagName("Item");
					if (items.length == 1) {
						this.New(items[0].getAttribute("Name"), items[0].getAttribute("Color"), items[0].getAttribute("Lock"));
						var nGroup = te.Data.Tabgroups.Data.length;
						te.Data.Tabgroups.Click = nGroup;
						LoadXml(xml, nGroup);
					}
				}
				this.Arrange();
			}
		},

		Save: function ()
		{
			var commdlg = api.CreateObject("CommonDialog");
			commdlg.InitDir = fso.BuildPath(te.Data.DataFolder, "layout");
			commdlg.Filter = MakeCommDlgFilter("*.xml");
			commdlg.DefExt = "xml";
			commdlg.Flags = OFN_OVERWRITEPROMPT;
			if (commdlg.ShowSave()) {
				var fn = api.PathUnquoteSpaces(commdlg.filename);
				var xml = CreateXml(true);
				var nGroup = te.Data.Tabgroups.Click;
				var cTC = te.Ctrls(CTRL_TC);
				for (var i in cTC) {
					if (cTC[i].Data.Group == nGroup) {
						SaveXmlTC(cTC[i], xml, 1);
					}
				}
				var item = xml.createElement("Group");
				item.setAttribute("Index", 1);
				xml.documentElement.appendChild(item);
				this.Save3(xml, item, nGroup - 1);
				try {
					xml.save(fn);
				} catch (e) {
					if (e.number != E_ACCESSDENIED) {
						ShowError(e, [GetText("Save"), fn].join(": "));
					}
				}
			}
		},

		Save2: function (xml)
		{
			var item = xml.createElement("Group");
			item.setAttribute("Index", te.Data.Tabgroups.Index);
			xml.documentElement.appendChild(item);
			for (var i = 0; i < te.Data.Tabgroups.Data.length; i++) {
				Addons.Tabgroups.Save3(xml, item, i)
			}
		},

		Save3: function (xml, parent, i)
		{
			var item = xml.createElement("Item");
			var o = te.Data.Tabgroups.Data[i];
			item.setAttribute("Name", o.Name);
			item.setAttribute("Color", o.Color);
			item.setAttribute("Lock", o.Lock);
			parent.appendChild(item);
		},

		Arrange: function (bForce)
		{
			this.Fix();
			var s = [];
			var o = document.getElementById("tabgroups");
			var tabs = o.getElementsByTagName("li");
			if (bForce || tabs.length != te.Data.Tabgroups.Data.length + 1) {
				for (var i = 0; i < te.Data.Tabgroups.Data.length; i++) {
					this.Tab(s, i + 1);
				}
				s.push('<li class=', Addons.Tabgroups.bTab ? ' "tab3"' : "menu", ' title="', GetText("New Tab"), '" onclick="return Addons.Tabgroups.Add()">+</li>');
				o.innerHTML = s.join("");
			}
			for (var i = 0; i < te.Data.Tabgroups.Data.length; i++) {
				this.Style(tabs, i + 1);
			}
			this.Change();
		},

		Tab: function (s, i)
		{
			s.push('<li id="tabgroups', i, '"');
			s.push(' onmousedown="return Addons.Tabgroups.Down(this)" onmouseup="return Addons.Tabgroups.Up(this)"');
			s.push(' oncontextmenu="return Addons.Tabgroups.Popup(this)" onmousewheel="Addons.Tabgroups.Wheel()"');
			s.push(' onmousemove="Addons.Tabgroups.Move(this)" ondblclick="return Addons.Tabgroups.Edit(this)"');
			s.push(' draggable="true" ondragstart="return Addons.Tabgroups.Start5(this)" ondragover="Addons.Tabgroups.Over5(this)" ondrop="Addons.Tabgroups.Drop5(this)" ondragend="Addons.Tabgroups.End5(this)"');
			s.push('></li>');
		},

		Style: function (tabs, i)
		{
			var o = tabs[i - 1];
			if (!o) {
				return;
			}
			var data = te.Data.Tabgroups.Data[i - 1];
			var s = [data.Name];
			if (data.Lock) {
				s.unshift('<img src="', Addons.TabPlus ? Addons.TabPlus.ImgLock : MakeImgSrc("bitmap:ieframe.dll,545,13,2", 0, false, 13), '" style="width: 13px; padding-right: 2px">');
			}
			o.innerHTML = s.join("");
			var style = o.style;
			var cl = data.Color;
			if (cl) {
				if (document.documentMode >= 10) {
					style.background = "none";
				} else {
					style.filter = "none";
				}
				style.backgroundColor = cl;
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
			if (i == te.Data.Tabgroups.Index) {
				o.className = Addons.Tabgroups.bTab ? 'activetab' : 'activemenu';
				style.zIndex = tabs.length;
			} else {
				if (Addons.Tabgroups.bTab) {
					o.className = i < te.Data.Tabgroups.Index ? 'tab' : 'tab2';
				} else {
					o.className = 'menu';
				}
				style.zIndex = tabs.length - i;
			}
		},

		Add: function ()
		{
			var s;
			var Name = {};
			for (var i = te.Data.Tabgroups.Data.length; i--;) {
				Name[te.Data.Tabgroups.Data[i].Name] = true;
			}
			for (var i = 0; i <= te.Data.Tabgroups.Data.length; i++) {
				s = GetText("Group") + (i + 1);
				if (!Name[s]) {
					this.New(s);
					break;
				}
			}
			this.Arrange(true);
		},

		New: function (a1, a2, a3)
		{
			var o = te.Object();
			o.Name = a1 || "";
			o.Color = a2 || "";
			o.Lock = api.LowPart(a3) & 1;
			te.Data.Tabgroups.Data.push(o);
		},

		Change: function (n)
		{
			var oShow = {};
			if (n > 0) {
				te.Data.Tabgroups.Click = n;
			}
			this.Fix();
			var nOld = te.Data.Tabgroups.Index;
			if (te.Data.Tabgroups.Click != te.Data.Tabgroups.Index && te.Data.Tabgroups.Click < te.Data.Tabgroups.Data.length + 1) {
				te.Data.Tabgroups.Index = te.Data.Tabgroups.Click;
				this.Arrange();
			}
			te.LockUpdate();
			setTimeout("te.UnlockUpdate();", 200);
			var bDisp = false;
			var freeTC = [];
			var preTC = [];
			var cTC = te.Ctrls(CTRL_TC);
			for (var i = 0; i < cTC.length; i++) {
				var TC = cTC[i];
				if (TC.Visible) {
					preTC.push(TC);
				} else if (!TC.Data.Group) {
					freeTC.push(TC);
				}
				var b = TC.Data.Group == te.Data.Tabgroups.Index;
				if (b) {
					var s = [TC.Left, TC.Top, TC.Width, TC.Height].join(",");
					if (oShow[s]) {
						b = false;
						delete TC.Data.Group;
					} else {
						oShow[s] = true;
					}
				}
				TC.Visible = b;
				bDisp |= b;
			}
			if (!bDisp) {
				if (preTC.length) {
					for (var i = 0; i < preTC.length; i++) {
						var PT = preTC[i];
						var TC = this.CreateTC(freeTC, PT.Left, PT.Top, PT.Width, PT.Height, PT.Style, PT.Align, PT.TabWidth, PT.TabHeight);
						if (TC.Count == 0) {
							var FV = PT.Selected;
							if (FV) {
								var TV = FV.TreeView;
								TC.Selected.Navigate2(FV.FolderItem, SBSP_NEWBROWSER, FV.Type, FV.CurrentViewMode, FV.FolderFlags, FV.Options, FV.ViewFlags, FV.IconSize, TV.Align, TV.Width, TV.Style, TV.EnumFlags, TV.RootStyle, TV.Root);
							} else {
								TC.Selected.Navigate2(HOME_PATH, SBSP_NEWBROWSER, te.Data.View_Type, te.Data.View_ViewMode, te.Data.View_fFlags, te.Data.View_Options, te.Data.View_ViewFlags, te.Data.View_IconSize, te.Data.Tree_Align, te.Data.Tree_Width, te.Data.Tree_Style, te.Data.Tree_EnumFlags, te.Data.Tree_RootStyle, te.Data.Tree_Root);
							}
							TC.Visible = true;
						}
					}
				} else {
					var TC = this.CreateTC(freeTC, 0, 0, "100%", "100%", te.Data.Tab_Style, te.Data.Tab_Align, te.Data.Tab_TabWidth, te.Data.Tab_TabHeight);
					TC.Data.Group = te.Data.Tabgroups.Index;
					TC.Selected.Navigate2(HOME_PATH, SBSP_NEWBROWSER, te.Data.View_Type, te.Data.View_ViewMode, te.Data.View_fFlags, te.Data.View_Options, te.Data.View_ViewFlags, te.Data.View_IconSize, te.Data.Tree_Align, te.Data.Tree_Width, te.Data.Tree_Style, te.Data.Tree_EnumFlags, te.Data.Tree_RootStyle, te.Data.Tree_Root);
				}
			}
			Resize();
		},

		CreateTC: function (freeTC, Left, Top, Width, Height, Style, Align, TabWidth, TabHeight)
		{
			var TC;
			if (freeTC.length) {
				TC = freeTC.shift();
				TC.Left = Left;
				TC.Top = Top;
				TC.Width = Width;
				TC.Height = Height;
				TC.Style = Style;
				TC.Align = Align;
				TC.TabWidth = TabWidth;
				TC.TabHeight = TabHeight;
				TC.Visible = true;
			} else {
				TC = te.CreateCtrl(CTRL_TC, Left, Top, Width, Height, Style, Align, TabWidth, TabHeight);
			}
			TC.Data.Group = te.Data.Tabgroups.Index;
			return TC;
		},

		Close: function (nPos, bNotUpdate)
		{
			if (te.Data.Tabgroups.Data[nPos - 1].Lock || (!bNotUpdate && !confirmOk("Are you sure?"))) {
				return;
			}
			var cTC = te.Ctrls(CTRL_TC);
			var i = cTC.length;
			if (i > 1) {
				while (i-- > 0) {
					var TC = cTC[i];
					if (TC.Data.Group == nPos) {
						TC.Close();
					} else if (TC.Data.Group > nPos) {
						TC.Data.Group--;
					}
				}
			}
			te.Data.Tabgroups.Data.splice(nPos - 1, 1);
			if (te.Data.Tabgroups.Index >= te.Data.Tabgroups.Data.length + 1 && te.Data.Tabgroups.Index > 1) {
				te.Data.Tabgroups.Index--;
			}
			if (!bNotUpdate) {
				this.Arrange();
			}
		},

		CloseOther: function (nPos)
		{
			if (confirmOk("Are you sure?")) {
				for (var i = te.Data.Tabgroups.Data.length; i--;) {
					if (i != nPos - 1) {
						this.Close(i + 1, true);
					}
				}
				this.Arrange();
			}
		},

		Down: function (o)
		{
			this.WheelButton = api.GetKeyState(VK_MBUTTON);
			if (api.GetKeyState(VK_LBUTTON) < 0) {
				api.GetCursorPos(this.pt);
				var n = o.id.replace(/\D/g, '') - 0;
				this.Change(n);
			}
			return true;
		},

		Up: function (o)
		{
			if (this.WheelButton < 0) {
				this.Close(o.id.replace(/\D/g, ''));
				return false;
			}
			this.Swap(o)
		},

		Swap: function (o)
		{
			if (this.nDrag && this.nDrag != this.nDrop) {
				var nDrop = o.id.replace(/\D/g, '');
				if (nDrop == this.nDrop) {
					this.nDrop = 0;
					var ar = new Array(te.Data.Tabgroups.Data.length);
					var Data = te.Data.Tabgroups.Data.concat();
					var j = 0;
					for (var i = 0; i < te.Data.Tabgroups.Data.length; i++) {
						if (j == nDrop - 1) {
							j++;
						}
						ar[i] = (i == this.nDrag - 1) ? nDrop - 1 : j++;
					}
					for (var i = 0; i < te.Data.Tabgroups.Data.length; i++) {
						te.Data.Tabgroups.Data[ar[i]] = Data[i];
					}
					var cTC = te.Ctrls(CTRL_TC);
					for (var i in cTC) {
						var TC = cTC[i];
						if (TC.Data.Group > ar.length) {
							TC.Close();
						} else {
							TC.Data.Group = ar[TC.Data.Group - 1] + 1;
						}
					}
					te.Data.Tabgroups.Click = nDrop;
					this.Arrange();
				}
			}
			return true;
		},

		Popup: function (o)
		{
			te.Data.Tabgroups.Click = o.id.replace(/\D/g, '') - 0;
			var hMenu = api.CreatePopupMenu();
			var sMenu = [1, "Rename", 5, "Color", 0, "", 2, "&Close Tab", 3, "Cl&amp;ose Other Tabs", 0, "", 4, "&New Tab", 6, "&Lock", 0, "", 7, "Load", 8, "Save"];
			for (var i = sMenu.length / 2; i--;) {
				var uId = sMenu[i * 2];
				var uFlags = uId ? MF_STRING : MF_SEPARATOR;
				if (te.Data.Tabgroups.Data[te.Data.Tabgroups.Click - 1].Lock) {
					if (uId == 2) {
						uFlags |= MF_DISABLED;
					}
					if (uId == 6) {
						uFlags |= MF_CHECKED;
					}
				}
				api.InsertMenu(hMenu, 0, MF_BYPOSITION | uFlags, uId, GetText(sMenu[i * 2 + 1]));
			}
			api.GetCursorPos(this.pt);
			var nVerb = api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, this.pt.x, this.pt.y, te.hwnd, null, null);
			api.DestroyMenu(hMenu);
			switch (nVerb) {
				case 1:
					this.Edit(o);
					break;
				case 2:
					this.Close(te.Data.Tabgroups.Click);
					break;
				case 3:
					this.CloseOther(te.Data.Tabgroups.Click);
					break;
				case 4:
					this.Add();
					break;
				case 5:
					this.SetColor();
					break;
				case 6:
					this.Lock();
					break;
				case 7:
					this.Load();
					break;
				case 8:
					this.Save();
					break;
			}
			return false;
		},

		Edit: function (o)
		{
			var s = InputDialog(GetText("Name"), te.Data.Tabgroups.Data[te.Data.Tabgroups.Click - 1].Name);
			if (s) {
				o.value = te.Data.Tabgroups.Data[te.Data.Tabgroups.Click - 1].Name = s;
				this.Arrange();
			}
		},

		SetColor: function ()
		{
			te.Data.Tabgroups.Data[te.Data.Tabgroups.Click - 1].Color = ChooseWebColor(te.Data.Tabgroups.Data[te.Data.Tabgroups.Click - 1].Color);
			this.Arrange();
		},

		Lock: function ()
		{
			te.Data.Tabgroups.Data[te.Data.Tabgroups.Click - 1].Lock ^= 1;
			this.Arrange();
		},

		Fix: function ()
		{
			var cTC = te.Ctrls(CTRL_TC);
			for (var i in cTC) {
				var TC = cTC[i];
				if (!TC.Data.Group && TC.Visible) {
					TC.Data.Group = te.Data.Tabgroups.Index;
				}
			}
		},

		Move: function (o)
		{
			if (api.GetKeyState(VK_LBUTTON) < 0) {
				this.nDrop = o.id.replace(/\D/g, '') - 0;
				if (!this.nDrag) {
					var pt = api.Memory("POINT");
					api.GetCursorPos(pt);
					if (IsDrag(pt, Addons.Tabgroups.pt)) {
						this.nDrag = this.nDrop;
						this.Cursor("move");
					}
				}
			} else if (this.nDrag) {
				this.Cursor("default");
				this.nDrag = 0;
			}
		},

		Cursor: function (s)
		{
			document.getElementById('tabgroups').style.cursor = s;
		},

		Over: function ()
		{
			clearTimeout(Addons.Tabgroups.tid);
			Addons.Tabgroups.tid = null;
			var pt = api.Memory("POINT");
			api.GetCursorPos(pt);
			if (!Addons.Tabgroups.Drag5 && !IsDrag(pt, Addons.Tabgroups.pt)) {
				Addons.Tabgroups.Change(Addons.Tabgroups.FromPt(pt));
			}
		},

		Start5: function (o)
		{
			event.dataTransfer.effectAllowed = 'move';
			this.Cursor("default")
			this.Drag5 = o.id;
			return api.GetKeyState(VK_LBUTTON) < 0;
		},

		End5: function (o)
		{
			this.Drag5 = null;
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
			var res = /^tabgroups(\d+)/.exec(o.id);
			if (res) {
				this.nDrop = res[1];
				res = /^tabgroups(\d+)/.exec(this.Drag5);
				if (res) {
					this.nDrag = res[1];
					this.Swap(o);
				}
			}
		},

		Wheel: function (n)
		{
			n = te.Data.Tabgroups.Click + (n || (- event.wheelDelta / 120));
			if (n < 1) {
				n = te.Data.Tabgroups.Data.length;
			}
			if (n >= te.Data.Tabgroups.Data.length + 1) {
				n = 1;
			}
			this.Change(n);
		},

		FromPt: function (pt)
		{
			for (var n = te.Data.Tabgroups.Data.length + 1; n-- > 0;) {
				if (HitTest(document.getElementById("tabgroups" + n), pt)) {
					return n;
				}
			}
			return -1;
		}

	};

	Addons.Tabgroups.Init();

	AddEventEx(window, "load", function ()
	{
		setTimeout("Addons.Tabgroups.Arrange();", 500);
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
			var i = Addons.Tabgroups.FromPt(pt);
			if (i >= 0) {
				if (i != te.Data.Tabgroups.Index) {
					if (IsDrag(pt, Addons.Tabgroups.pt)) {
						clearTimeout(Addons.Tabgroups.tid);
						Addons.Tabgroups.pt = pt.Clone();
						Addons.Tabgroups.tid = setTimeout(Addons.Tabgroups.Over, 300);
					}
				}
				if (te.Data.DragTab) {
					pdwEffect[0] = DROPEFFECT_LINK;
				}
				return S_OK;
			}
		}
	});

	AddEvent("Drop", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect)
	{
		if (Ctrl.Type == CTRL_WB) {
			if (te.Data.DragTab) {
				Addons.Tabgroups.Over();
				var TC = te.Ctrl(CTRL_TC);
				te.Data.DragTab.Move(te.Data.DragIndex, TC.Count, TC);
				TC.SelectedIndex = TC.Count - 1;
				return S_OK;
			}
		}
	});

	AddEvent("DragLeave", function (Ctrl)
	{
		clearTimeout(Addons.Tabgroups.tid);
		Addons.Tabgroups.tid = null;
	});

	AddEvent("LoadWindow", Addons.Tabgroups.LoadWindow);

	AddEvent("SaveWindow", function (xml, all)
	{
		Addons.Tabgroups.Save2(xml);
		if (all && Addons.Tabgroups.DeleteOldXml) {
			DeleteItem(fso.BuildPath(te.Data.DataFolder, "config\\tabgroups.xml"));
		}
	});

	AddEvent("MouseMessage", function (Ctrl, hwnd, msg, wParam, pt)
	{
		if (msg == WM_LBUTTONDOWN && Ctrl.Type == CTRL_TE) {
			if (!IsDrag(pt, Addons.Tabgroups.pt)) {
				setTimeout(function ()
				{
					FireEvent(document.getElementById("tabgroups" + te.Data.Tabgroups.Click), "dblclick");
				}, 99);
			}
		}
	});

	AddEventId("AddonDisabledEx", "tabgroups", function ()
	{
		delete te.Data.Tabgroups;
	});
} else {
	var ado = OpenAdodbFromTextFile("addons\\" + Addon_Id + "\\options.html");
	if (ado) {
		SetTabContents(0, "General", ado.ReadText(adReadAll));
		ado.Close();
	}
}
