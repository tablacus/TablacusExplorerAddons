var Addon_Id = "tabgroups";
var Default = "ToolBar5Center";

if (window.Addon == 1) {
	Addons.Tabgroups =
	{
		Name: null,
		Index: 1,
		Click: 0,
		nDrag: 0,
		nDrop: 0,
		WheelButton: 0,
		tid: null,
		pt: api.Memory("POINT"),

		Init: function ()
		{
			var s = []
			s.push('<span id="tabgroups">tabgroups</span>');
			s.push('<input type="button" class="tab" value="+" title="' + GetText("New Tab") + '" onclick="return Addons.Tabgroups.Add()" hidefocus="true">');
			SetAddon(Addon_Id, Default, s.join(""));
			this.Name = [''];
			xml = OpenXml("tabgroups.xml", true, true);
			var items = xml.getElementsByTagName('Item');
			for (i = 0; i < items.length; i++) {
				this.Name.push(items[i].getAttribute("Name"));
			}
			items = xml.getElementsByTagName('Index');
			if (items.length) {
				this.Click = items[0].text;
			}
			this.Arrange();
		},

		Save: function ()
		{
			var xml = CreateXml();
			var root = xml.createElement("TablacusExplorer");
			for (var i = 1; i < Addons.Tabgroups.Name.length; i++) {
				var item = xml.createElement("Item");
				item.setAttribute("Name", Addons.Tabgroups.Name[i]);
				root.appendChild(item);
			}
			var item = xml.createElement("Index");
			item.text = Addons.Tabgroups.Index;
			root.appendChild(item);
			xml.appendChild(root);
			SaveXmlEx("tabgroups.xml", xml, true);
		},

		Arrange: function ()
		{
			this.Fix();
			var s = [];
			for (var i = 1; i < this.Name.length; i++) {
				this.Tab(s, i);
			}
			document.getElementById("tabgroups").innerHTML = s.join("");
			this.Change();
		},

		Tab: function (s, i)
		{
			s.push('<input type="button" style="border: 1px solid #898C95; ');
			s.push('font-family: ' + document.body.style.fontFamily + '; margin: 0px;" value="' + this.Name[i]);
			s.push('" id="tabgroups' + i);
			s.push('" onmousedown="return Addons.Tabgroups.Down(this)" onmouseup="return Addons.Tabgroups.Up(this)"');
			s.push(' onmousemove="Addons.Tabgroups.Move(this)"');
			s.push(' oncontextmenu="return Addons.Tabgroups.Popup(this)" onmousewheel="Addons.Tabgroups.Wheel()"');
			s.push(' ondblclick="return Addons.Tabgroups.Edit(this)"');
			s.push(' draggable="true" ondragstart="Addons.Tabgroups.Start5(this)" ondragover="Addons.Tabgroups.Over5(this)" ondrop="Addons.Tabgroups.Drop5(this)" ondragend="Addons.Tabgroups.End5(this)"');
			s.push('class="');
			s.push(i == this.Index ? 'activetab' : 'tab');
			s.push('"  hidefocus="true">');
		},

		Add: function ()
		{
			var avail = this.Name.join("\0") + "\0";
			for (var i = 1; i <= this.Name.length + 1; i++) {
				var s = GetText("Group") + i;
				if (!avail.match(s + "\0")) {
					this.Name.push(s);
					break;
				}
			}
			var s = [];
			this.Tab(s, this.Name.length - 1);
			document.getElementById("tabgroups").insertAdjacentHTML("BeforeEnd", s.join(""));
			this.Fix();
		},

		Change: function (n)
		{
			if (n > 0) {
				this.Click = n;
			}
			this.Fix();
			var nOld = this.Index;
			if (this.Click != this.Index) {
				var o = document.getElementById("tabgroups" + this.Click);
				if (o) {
					var pre = document.getElementById("tabgroups" + this.Index);
					if (pre) {
						pre.className = "tab";
					}
					this.Fix();
					this.Index = this.Click;
					o.className = "activetab";
				}
			}
			var bDisp = false;
			var freeTC = [];
			var preTC = [];
			var Tabs = te.Ctrls(CTRL_TC);
			for (var i = 0; i < Tabs.Count; i++) {
				var TC = Tabs.Item(i);
				if (TC.Visible) {
					preTC.push(TC);
				}
				else if (!TC.Data.Group) {
					freeTC.push(TC);
				}
				var b = TC.Data.Group == this.Index;
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
								TC.Selected.Navigate2(FV.FolderItem, SBSP_NEWBROWSER, FV.Type, FV.CurrentViewMode, FV.fFlags, FV.Options, FV.ViewFlags, FV.IconSize, TV.Align, TV.Width, TV.Style, TV.EnumFlags, TV.RootStyle, TV.Root);
							}
							else {
								TC.Selected.Navigate2(HOME_PATH, SBSP_NEWBROWSER, te.Data.View_Type, te.Data.View_ViewMode, te.Data.View_fFlags, te.Data.View_Options, te.Data.View_ViewFlags, te.Data.View_IconSize, te.Data.Tree_Align, te.Data.Tree_Width, te.Data.Tree_Style, te.Data.Tree_EnumFlags, te.Data.Tree_RootStyle, te.Data.Tree_Root);
							}
							TC.Visible = true;
						}
					}
				}
				else {
					var TC = this.CreateTC(freeTC, 0, 0, "100%", "100%", te.Data.Tab_Style, te.Data.Tab_Align, te.Data.Tab_TabWidth, te.Data.Tab_TabHeight);
					TC.Data.Group = this.Index;
					TC.Selected.Navigate2(HOME_PATH, SBSP_NEWBROWSER, te.Data.View_Type, te.Data.View_ViewMode, te.Data.View_fFlags, te.Data.View_Options, te.Data.View_ViewFlags, te.Data.View_IconSize, te.Data.Tree_Align, te.Data.Tree_Width, te.Data.Tree_Style, te.Data.Tree_EnumFlags, te.Data.Tree_RootStyle, te.Data.Tree_Root);
				}
			}
		},

		CreateTC: function (freeTC, Left, Top, Width, Height, Style, Align, TabWidth, TabHeight)
		{
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
			}
			else {
				TC = te.CreateCtrl(CTRL_TC, Left, Top, Width, Height, Style, Align, TabWidth, TabHeight);
			}
			TC.Data.Group = this.Index;
			return TC;
		},

		Close: function (nPos)
		{
			var Tabs = te.Ctrls(CTRL_TC);
			var i = Tabs.Count - 1;
			if (i > 0) {
				for (; i >= 0; i--) {
					var TC = Tabs.Item(i);
					if (TC.Data.Group == nPos) {
						TC.Close();
					}
					else if (TC.Data.Group > nPos) {
						TC.Data.Group--;
					}
				}
			}
			this.Name.splice(nPos, 1);
			if (this.Index >= this.Name.length && this.Index > 1) {
				this.Index--;
			}
			this.Arrange();
		},

		CloseOther: function (nPos)
		{
			var Tabs = te.Ctrls(CTRL_TC);
			var i = Tabs.Count - 1;
			if (i > 0) {
				for (; i >= 0; i--) {
					var TC = Tabs.Item(i);
					if (TC.Data.Group != nPos) {
						TC.Close();
					}
					else {
						TC.Data.Group = 1;
					}
				}
			}
			this.Name = ["", this.Name[nPos]];
			this.Index = 1;
			this.Arrange();
		},

		Down: function (o)
		{
			this.Click = o.id.replace(/\D/g, '') - 0;
			this.WheelButton = api.GetKeyState(VK_MBUTTON);
			if (api.GetKeyState(VK_LBUTTON) < 0) {
				api.GetCursorPos(this.pt);
				this.Change();
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
					var ar = new Array(this.Name.length);
					var j = 0;
					for (var i = 0; i < this.Name.length; i++) {
						if (j == nDrop) {
							j++;
						}
						ar[i] = (i == this.nDrag) ? nDrop : j++;
					}
					for (var i = 1; i < this.Name.length; i++) {
						this.Name[ar[i]] = document.getElementById("tabgroups" + i).value;
					}

					var Tabs = te.Ctrls(CTRL_TC);
					for (var i = Tabs.Count - 1; i >= 0; i--) {
						var TC = Tabs.Item(i);
						if (TC.Data.Group >= ar.length) {
							TC.Close();
						}
						else {
							TC.Data.Group = ar[TC.Data.Group];
						}
					}
					this.Click = nDrop;
					this.Arrange();
				}
			}
			return true;
		},

		Popup: function (o)
		{
			this.Click = o.id.replace(/\D/g, '') - 0;
			var hMenu = api.CreatePopupMenu();
			var sMenu = [1, "&Edit", 2, "&Close Tab", 3, "Cl&amp;ose Other Tabs", 4, "&New Tab"];
			for (var i = 0; i < sMenu.length; i += 2) {
				api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, sMenu[i], GetText(sMenu[i + 1]));
			}
			api.GetCursorPos(this.pt);
			var nVerb = api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, this.pt.x, this.pt.y, te.hwnd, null, null);
			api.DestroyMenu(hMenu);
			switch (nVerb) {
				case 1:
					this.Edit(o);
					break
				case 2:
					this.Close(this.Click);
					break
				case 3:
					this.CloseOther(this.Click);
					break
				case 4:
					this.Add();
					break
			}
			return false;
		},

		Edit: function (o)
		{
			var s = InputDialog(GetText("Name"), this.Name[this.Click]);
			if (s) {
				o.value = this.Name[this.Click] = s;
			}
		},

		Fix: function ()
		{
			var Tabs = te.Ctrls(CTRL_TC);
			for (var i = Tabs.Count - 1; i >= 0 ; i--) {
				var TC = Tabs.Item(i);
				if (!TC.Data.Group && TC.Visible) {
					TC.Data.Group = this.Index;
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
			}
			else if (this.nDrag) {
				this.Cursor("auto");
				this.nDrag = 0;
			}
		},

		Cursor: function (s)
		{
			for (var i = this.Name.length - 1; i > 0; i--) {
				document.getElementById('tabgroups' + i).style.cursor = s;
			}
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
			this.Drag5 = o.id;
		},

		End5: function (o)
		{
			this.Drag5 = null;
		},

		Over5: function (o)
		{
			if (this.Drag5) {
				event.preventDefault();
			}
		},

		Drop5: function (o)
		{
			if (/^tabgroups(\d+)/.test(o.id)) {
				this.nDrop = RegExp.$1;
				if (/^tabgroups(\d+)/.test(this.Drag5)) {
					this.nDrag = RegExp.$1;
					this.Swap(o);
				}
			}
		},

		Wheel: function ()
		{
			this.Click = this.Click - event.wheelDelta / 120
			if (this.Click < 1) {
				this.Click = this.Name.length - 1;
			}
			if (this.Click >= this.Name.length) {
				this.Click = 1;
			}
			this.Change();
		},

		FromPt: function (pt)
		{
			var n = this.Name.length;
			while (--n >= 0) {
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
		setTimeout("Addons.Tabgroups.Change();", 500);
	});

	AddEvent("Finalize", Addons.Tabgroups.Save);

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
				if (i != Addons.Tabgroups.Index) {
					if (IsDrag(pt, Addons.Tabgroups.pt)) {
						clearTimeout(Addons.Tabgroups.tid);
						Addons.Tabgroups.pt = pt.Clone();
						Addons.Tabgroups.tid = setTimeout(Addons.Tabgroups.Over, 300);
					}
				}
				if (te.Data.DragTab) {
					pdwEffect.x = DROPEFFECT_LINK;
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

	AddEvent("Dragleave", function (Ctrl)
	{
		clearTimeout(Addons.Tabgroups.tid);
		Addons.Tabgroups.tid = null;
	});
}
