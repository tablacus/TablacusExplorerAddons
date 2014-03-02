var Addon_Id = "inneraddressbar";

var items = te.Data.Addons.getElementsByTagName(Addon_Id);
if (items.length) {
	var item = items[0];
	if (!item.getAttribute("Set")) {
		item.setAttribute("Menu", "Edit");
		item.setAttribute("MenuPos", -1);

		item.setAttribute("KeyExec", 1);
		item.setAttribute("KeyOn", "All");
		item.setAttribute("Key", "Alt+D");
	}
}

if (window.Addon == 1) {
	Addons.InnerAddressBar =
	{
		tid: [],
		bDrag: false,
		bSet: [],
		nPos: 0,
		strName: "Inner Address Bar",

		Add: function (level, path)
		{
			var cTC = te.Ctrls(CTRL_TC);
			for (var nTC = cTC.Count; nTC-- > 0;) {
				var o = document.getElementById("combobox_" + cTC.Item(nTC).Id);
				if (o) {
					o.options[++o.length - 1].text = new Array(level * 4 + 1).join("\xa0") + api.GetDisplayNameOf(path, SHGDN_INFOLDER);
					o.options[o.length - 1].value = path;
					if (o.length == 1) {
						this.Length(o);
					}
				}
			}
		},

		Arrange: function (Id)
		{
			try {
				clearTimeout(this.tid[Id]);
				this.tid[Id] = null;
				var TC = te.Ctrl(CTRL_TC, Id);
				if (TC && TC.Visible) {
					if (!this.bSet[Id]) {
						this.GetAddress(Ctrl.Selected);
					}
					var cbbx = document.getElementById("combobox_" + Id);
					var addr = document.getElementById("addressbar_" + Id);
					var ie6 = document.getElementById("forie6_" + Id);
					var img = document.getElementById("addr_img_" + Id);
					if (!addr.style.border) {
						cbbx.style.height = addr.offsetHeight + "px";
						addr.style.border = "0px";
						img.style.top = (cbbx.offsetHeight - 16) / 2 + "px";
						addr.style.visibility = "visible";
					}
					var panel = document.getElementById("Panel_" + Id);
					var w = cbbx.offsetWidth - 41;
					w = w > 0 ? w : 0;
					var h = cbbx.offsetHeight - 4;
					h = h > 0 ? h : 0;

					ie6.style.width = w + 19 + "px";
					ie6.style.height = h + "px";
					addr.style.height = h + "px";
					addr.style.width = w + "px";
				}
			} catch (e) {}
		},

		Length: function (o)
		{
			if (o.length && osInfo.dwMajorVersion == 6 && osInfo.dwMinorVersion == 1) {
				var ie10 = document.getElementById("Size");
				var s = o.options[0].text.replace(/\s*$/g, "");
				ie10.innerText = s;
				ie10.style.fontSize = "125%";
				var w = o.offsetWidth - ie10.offsetWidth;
				if (w > 0) {
					ie10.innerText = new Array(10).join("\xa0");
					o.options[0].text = s + new Array(Math.floor(w * 10 / ie10.offsetWidth)).join("\xa0");
				}
				ie10.innerText = "";
			}
		},

		Select: function (o, Id)
		{
			var s = o[o.selectedIndex].value;
			if (s != "-") {
				var FV = GetInnerFV(Id);
				if (FV) {
					NavigateFV(FV, s);
				}
				o.selectedIndex = -1;
			}
		},

		KeyDown: function (o, Id)
		{
			if (event.keyCode == VK_RETURN) {
				this.Navigate(Id);
				return false;
			}
			return true;
		},

		Click: function (o, Id)
		{
			var pt = api.Memory("POINT");
			api.GetCursorPos(pt);
			p = GetPos(document.getElementById("addressbar_" + Id), true);
			if (pt.x < p.x) {
				this.Open(o);
				return false;
			}
			return true;
		},

		MouseDown: function (o, Id)
		{
			this.bDrag = true;
		},

		MouseUp: function (o)
		{
			this.bDrag = false;
		},

		Navigate: function (Id)
		{
			var o = document.getElementById("addressbar_" + Id);
			var p = GetPos(o, true);
			var pt = api.Memory("POINT");
			pt.y = p.y + o.offsetHeight;
			window.Input = o.value;
			if (ExecMenu(te.Ctrl(CTRL_WB), "Alias", pt, 2) != S_OK) {
				var FV = GetInnerFV(Id);
				if (FV) {
					NavigateFV(FV, o.value, OpenMode);
				}
			}
		},

		Open: function (o, Id)
		{
			var FV = GetInnerFV(Id);
			if (FV) {
				pt = GetPos(o, true);
				var FolderItem = FolderMenu.Open(FV.FolderItem, pt.x, pt.y + o.offsetHeight);
				FolderMenu.Invoke(FolderItem);
				FolderMenu.Clear();
			}
			return false;
		},

		Popup: function (o, Id)
		{
			o.blur();
			var FV = GetInnerFV(Id);
			if (FV) {
				var hMenu = api.CreatePopupMenu();
				FolderMenu.Clear();
				var pt = api.Memory("POINT");
				api.GetCursorPos(pt);
				p = GetPos(document.getElementById("addressbar"), true);
				var Log = (pt.x < p.x) ? FV.History : sha.NameSpace(ssfDRIVES).Items();
				for (var i = 0; i < Log.Count; i++) {
					FolderMenu.AddMenuItem(hMenu, Log.Item(i));
					if (pt.x < p.x && i == Log.Index) {
						var mii = api.Memory("MENUITEMINFO");
						mii.cbSize = mii.Size;
						mii.fMask  = MIIM_STATE;
						mii.fState = MF_DEFAULT;
						api.SetMenuItemInfo(hMenu, i, true, mii);
					}
				}
				window.g_menu_click = true;
				var nVerb = api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null, null);
				api.DestroyMenu(hMenu);
				if (nVerb) {
					var FolderItem = FolderMenu.Items[nVerb - 1];
					switch (window.g_menu_button - 0) {
						case 2:
							PopupContextMenu(FolderItem);
							break;
						case 3:
							Navigate(FolderItem, SBSP_NEWBROWSER);
							break;
						default:
							Navigate(FolderItem, OpenMode);
							break;
					}
				}
				FolderMenu.Clear();
			}
			return false;
		},

		Drag: function (Id)
		{
			if (this.bDrag) {
				this.bDrag = false;
				var TC = te.Ctrl(CTRL_TC, Id);
				if (TC && TC.SelectedIndex >= 0) {
					var pdwEffect = api.Memory("DWORD");
					pdwEffect.Item(0) = DROPEFFECT_COPY | DROPEFFECT_MOVE | DROPEFFECT_LINK;
					te.Data.DragTab = TC;
					te.Data.DragIndex = TC.SelectedIndex;
					api.DoDragDrop(TC.Item(TC.SelectedIndex).FolderItem, pdwEffect.Item(0), pdwEffect);
					te.Data.DragTab = null;
				}
			}
		},

		Focus: function (o, Id)
		{
			var FV = GetInnerFV(Id);
			FV.Focus();
			o.select();
			o.focus();
		},

		Resize: function (Id)
		{
			if (!this.tid[Id]) {
				this.tid[Id] = setTimeout("Addons.InnerAddressBar.Arrange(" + Id + ")", 100);
			}
		},

		GetAddress: function (Ctrl)
		{
			if (Ctrl.FolderItem && Ctrl.Id == Ctrl.Parent.Selected.Id) {
				var Id = Ctrl.Parent.Id;
				var o = document.getElementById("addressbar_" + Id);
				if (o) {
					o.value = api.GetDisplayNameOf(Ctrl.FolderItem, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
					if (document.documentMode) {
						var info = api.Memory("SHFILEINFO");
						api.ShGetFileInfo(Ctrl.FolderItem, 0, info, info.Size, SHGFI_ICON | SHGFI_SMALLICON | SHGFI_PIDL);
						var image = te.GdiplusBitmap();
						image.FromHICON(info.hIcon, api.GetSysColor(COLOR_BTNFACE));
						api.DestroyIcon(info.hIcon);
						document.getElementById("addr_img_" + Id).src = image.DataURI("image/png");
					}
				}
				Addons.InnerAddressBar.bSet[Id] = true;
				Addons.InnerAddressBar.Resize(Id);
			}
		},

		Exec: function ()
		{
			var TC = te.Ctrl(CTRL_TC);
			if (TC) {
				document.getElementById("addressbar_" + TC.Id).focus();
			}
			return S_OK;
		}

	};

	AddEvent("PanelCreated", function (Ctrl)
	{
		var s = [];
		s.push('<div style="position: relative; width; 100px; overflow: hidden">');
		s.push('<select id="combobox_$" onchange="Addons.InnerAddressBar.Select(this, $);" hidefocus="true"')
		s.push(' onclick="return Addons.InnerAddressBar.Click(this, $);"');
		s.push(' oncontextmenu="return Addons.InnerAddressBar.Popup(this, $);"');
		s.push(' onmouseout="Addons.InnerAddressBar.Drag(this, $);"');
		s.push(' onresize="Addons.InnerAddressBar.Resize($);"');
		s.push(' style="width: 100%"><option>\xa0</option></select>');

		s.push('<img id="addr_img_$" icon="shell32.dll,3,16"');
		s.push(' onmousedown="Addons.InnerAddressBar.MouseDown(this, $);"');
		s.push(' onmouseup="Addons.InnerAddressBar.MouseUp();"');
		s.push(' onclick="return Addons.InnerAddressBar.Open(document.getElementById(\'combobox_$\'), $);"');
		s.push(' oncontextmenu="return Addons.InnerAddressBar.Popup(this, $);"');
		s.push(' onmouseout="Addons.InnerAddressBar.Drag(this);"');
		s.push(' style="position: absolute; left: 4px; top: 2px; width: 16px; height: 16px; z-index: 3; border: 0px" />');
		if (document.documentMode) {
			s.push('<div id="forie6_$" scrolling="no" frameborder="0" style="position: absolute; left: 2px; top: 2px; width: 0px; height: 1px; z-index: 2; display: inline; background-color: window"></div>');
		}
		else {
			s.push('<iframe id="forie6_$" scrolling="no" frameborder="0" style="position: absolute; left: 2px; top: 2px; width: 0px; height: 1px; z-index: 2; display: inline"></iframe>');
		}
		s.push('<input id="addressbar_$" type="text" onkeydown="return Addons.InnerAddressBar.KeyDown(this, $)" onfocus="Addons.InnerAddressBar.Focus(this, $)" onblur="this.value=this.value"');
		s.push(' style="position: absolute; left: 21px; top: 2px; z-index: 3; visibility: hidden" /></div>');
		SetAddon(null, "Inner1Center_" + Ctrl.Id, s.join("").replace(/\$/g, Ctrl.Id));
		var o = document.getElementById("Inner1Center_" + Ctrl.Id);
		if (o.style.verticalAlign.length == 0) {
			o.style.verticalAlign = "middle";
		}
		DeviceChanged();
		if (Ctrl.Visible && Ctrl.Selected) {
			ChangeView(Ctrl.Selected);
		}
		Addons.InnerAddressBar.Resize(Ctrl.Id);
	});

	AddEvent("DeviceChanged", function ()
	{
		var cTC = te.Ctrls(CTRL_TC);
		for (var nTC = cTC.Count; nTC--;) {
			var TC = cTC.Item(nTC);
			var cbbx = document.getElementById("combobox_" + TC.Id);
			if (cbbx) {
				cbbx.length = 0;
				if (osInfo.dwMajorVersion * 100 + osInfo.dwMinorVersion >= 602) {
					var o = cbbx.options[++cbbx.length - 1];
					o.text = GetText("Select");
					o.value = "-"
				}
			}
			else if (TC.Visible) {
				setTimeout(DeviceChanged, 1000);
				return;
			}
		}
		Addons.InnerAddressBar.Add(0, ssfDESKTOP);
		Addons.InnerAddressBar.Add(1, ssfDRIVES);

		var Items = sha.NameSpace(ssfDRIVES).Items();
		for (var i = 0; i < Items.Count; i++) {
			var path = api.GetDisplayNameOf(Items.Item(i), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
			if (path) {
				Addons.InnerAddressBar.Add(2, path);
			}
		}
		Addons.InnerAddressBar.Add(1, ssfBITBUCKET);

		for (var nTC = cTC.Count; nTC-- > 0;) {
			var cbbx = document.getElementById("combobox_" + cTC.Item(nTC).Id);
			if (cbbx) {
				cbbx.selectedIndex = -1
			}
		}
	});

	AddEvent("ChangeView", Addons.InnerAddressBar.GetAddress);

	AddEvent("Arrange", function (Ctrl, rc)
	{
		if (Ctrl.Type == CTRL_TC) {
			if (Ctrl.Selected) {
				Addons.InnerAddressBar.Resize(Ctrl.Id);
			}
		}
	});

	if (items.length) {
		//Menu
		if (item.getAttribute("MenuExec")) {
			Addons.InnerAddressBar.nPos = api.LowPart(item.getAttribute("MenuPos"));
			var s = item.getAttribute("MenuName");
			if (s && s != "") {
				Addons.InnerAddressBar.strName = s;
			}
			AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
			{
				api.InsertMenu(hMenu, Addons.InnerAddressBar.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Addons.InnerAddressBar.strName));
				ExtraMenuCommand[nPos] = Addons.InnerAddressBar.Exec;
				return nPos;
			});
		}
		//Key
		if (item.getAttribute("KeyExec")) {
			SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.InnerAddressBar.Exec, "Func");
		}
		//Mouse
		if (item.getAttribute("MouseExec")) {
			SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.InnerAddressBar.Exec, "Func");
		}
	}
	AddTypeEx("Add-ons", "Inner Address Bar", Addons.InnerAddressBar.Exec);
}
