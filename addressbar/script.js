var Addon_Id = "addressbar";
var Default = "ToolBar2Center";

if (window.Addon == 1) { (function () {
	Addons.AddressBar =
	{
		tid: null,
		bDrag: false,

		Add: function (level, path)
		{
			var o = document.getElementById("combobox");
			o.options[++o.length - 1].text = new Array(level * 3 + 1).join("\xa0") + api.GetDisplayNameOf(path, SHGDN_INFOLDER);
			o.options[o.length - 1].value = path;
			if (o.length == 1) {
				this.Length(o);
			}
		},

		Arrange: function ()
		{
			if (this.tid) {
				clearTimeout(this.tid);
				this.tid = null;
			}
			var cbbx = document.getElementById("combobox");
			var addr = document.getElementById("addressbar");
			var ie6 = document.getElementById("forie6");
			var img = document.getElementById("addr_img");
			var ie10 = document.getElementById("Size");

			var p = GetPos(cbbx, false);
			var w = cbbx.offsetWidth - 41;
			w = w > 0 ? w : 0;
			var h = cbbx.offsetHeight - 4;
			h = h > 0 ? h : 0;
			if (ie6) {
				ie6.style.left = p.x + 2 + "px";
				ie6.style.top = p.y + 2 + "px";
				ie6.style.width = w + 19 + "px";
				ie6.style.height = (h - 0) + "px";
			}
			img.style.left = p.x + 4 + "px";
			img.style.top = p.y + (cbbx.offsetHeight - 16) / 2 + "px";
			addr.style.left = p.x + 21 + "px";
			addr.style.top = p.y + 2 + "px";
			if (h >= 2) {
				h -= 2;
			}
			addr.style.height = h + "px";
			addr.style.width = w + "px";
			this.Length(cbbx);
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

		Select: function (o)
		{
			Navigate(o[o.selectedIndex].value);
			o.selectedIndex = -1;
		},

		KeyDown: function (o)
		{
			if (event.keyCode == VK_RETURN) {
				this.Navigate();
				return false;
			}
			return true;
		},

		Click: function (o)
		{
			var pt = api.Memory("POINT");
			api.GetCursorPos(pt);
			p = GetPos(document.getElementById("addressbar"), true);
			if (pt.x < p.x) {
				this.Open(o);
				return false;
			}
			return true;
		},

		MouseDown: function (o)
		{
			this.bDrag = true;
		},

		MouseUp: function (o)
		{
			this.bDrag = false;
		},

		Navigate: function ()
		{
			var o = document.F.addressbar;
			var p = GetPos(o, true);
			var pt = api.Memory("POINT");
			pt.y = p.y + o.offsetHeight;
			window.Input = o.value;
			if (ExecMenu(te.Ctrl(CTRL_WB), "Alias", pt, 2) != S_OK) {
				Navigate(o.value, OpenMode);
			}
		},

		Open: function (o)
		{
			var FV = te.Ctrl(CTRL_FV);
			if (FV) {
				pt = GetPos(o, true);
				var FolderItem = FolderMenu.Open(FV.FolderItem, pt.x, pt.y + o.offsetHeight);
				if (FolderItem) {
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
			}
			return false;
		},

		Popup: function (o)
		{
			o.blur();
			var FV = te.Ctrl(CTRL_FV);
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

		Drag: function ()
		{
			if (this.bDrag) {
				this.bDrag = false;
				var TC = te.Ctrl(CTRL_TC);
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

		Resize: function ()
		{
			if (!this.tid) {
				this.tid = setTimeout("Addons.AddressBar.Arrange()", 100);
			}
		}
	};

	var s = [];
	s.push('<select id="combobox" onchange="Addons.AddressBar.Select(this);"')
	s.push(' onclick="return Addons.AddressBar.Click(this);"');
	s.push(' oncontextmenu="return Addons.AddressBar.Popup(this);"');
	s.push(' onresize="Addons.AddressBar.Resize();"');
	s.push(' hidefocus="true" style="width: 100%;"><option>\xa0</option></select>');

	s.push('<img id="addr_img" icon="shell32.dll,3,16"');
	s.push(' onmousedown="Addons.AddressBar.MouseDown(this);"');
	s.push(' onmouseup="Addons.AddressBar.MouseUp();"');
	s.push(' onclick="return Addons.AddressBar.Open(document.getElementById(\'combobox\'));"');
	s.push(' oncontextmenu="return Addons.AddressBar.Popup(this);"');
	s.push(' onmouseout="Addons.AddressBar.Drag(this);"');
	s.push(' style="position: absolute;left 0; width: 0px; width: 16px; height: 16px; z-index: 3; border: 0px">');

	if (document.documentMode) {
		s.push('<div id="forie6" scrolling="no" frameborder="0" style="position: absolute; left 0px; width: 0px; height: 1px; z-index: 2; display: inline; background-color: window"></div>');
	}
	else {
		s.push('<iframe id="forie6" scrolling="no" frameborder="0" style="position: absolute; left 0px; width: 0px; height: 1px; z-index: 2; display: inline"></iframe>');
	}
	s.push('<input id="addressbar" type="text" onkeydown="return Addons.AddressBar.KeyDown(this)" onfocus="this.select()"');
	s.push(' style="position: absolute;left 0; width: 0px; height: 1px; z-index: 3; border: 0px">');
	var o = document.getElementById(SetAddon(Addon_Id, Default, s));

	if (o.style.verticalAlign.length == 0) {
		o.style.verticalAlign = "middle";
	}
	Addons.AddressBar.tid = setTimeout("Addons.AddressBar.Arrange()", 100);

	AddEvent("DeviceChanged", function ()
	{
		document.F.combobox.length = 0;
		Addons.AddressBar.Add(0, ssfDESKTOP);
		Addons.AddressBar.Add(1, ssfPERSONAL);
		Addons.AddressBar.Add(1, ssfDRIVES);

		var Items = sha.NameSpace(ssfDRIVES).Items();
		for (var i = 0; i < Items.Count; i++) {
			var path = api.GetDisplayNameOf(Items.Item(i), SHGDN_FORPARSING);
			if (path.length <= 3) {
				Addons.AddressBar.Add(2, path);
			}
		}
		Addons.AddressBar.Add(1, ssfBITBUCKET);
		document.F.combobox.selectedIndex = -1
	});

	AddEvent("ChangeView", function (Ctrl)
	{
		if (Ctrl.FolderItem) {
			document.F.addressbar.value = api.GetDisplayNameOf(Ctrl.FolderItem, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
			if (document.documentMode) {
				var info = api.Memory("SHFILEINFO");
				api.ShGetFileInfo(Ctrl.FolderItem, 0, info, info.Size, SHGFI_ICON | SHGFI_SMALLICON | SHGFI_PIDL);
				var image = te.GdiplusBitmap;
				image.FromHICON(info.hIcon, api.GetSysColor(COLOR_WINDOW));
				api.DestroyIcon(info.hIcon);
				document.getElementById("addr_img").src = image.DataURI("image/png");
			}
		}
	});

	AddEvent("SetAddress", function (s)
	{
		document.F.addressbar.value = s;
	});

	GetAddress = function ()
	{
		return document.F.addressbar.value;
	}
})();}
