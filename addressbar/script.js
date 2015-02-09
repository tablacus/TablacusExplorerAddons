var Addon_Id = "addressbar";
var Default = "ToolBar2Center";

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
	Addons.AddressBar =
	{
		tid: null,
		Item: null,
		bLoop: false,
		nLevel: 0,
		tid2: null,
		bClose: false,
		bXP: false,
		nPos: 0,
		nWidth: 0,
		strName: "Address Bar",

		KeyDown: function (o)
		{
			if (event.keyCode == VK_RETURN) {
				var o = document.F.addressbar;
				var p = GetPos(o);
				var pt = api.Memory("POINT");
				pt.x = screenLeft + p.x;
				pt.y = screenTop + p.y + o.offsetHeight;
				window.Input = o.value;
				if (ExecMenu(te.Ctrl(CTRL_WB), "Alias", pt, 2) != S_OK) {
					Navigate(o.value, GetNavigateFlags());
				}
				return false;
			}
			return true;
		},

		Resize: function ()
		{
			clearTimeout(this.tid);
			this.tid = setTimeout(this.Arrange, 500);
		},

		Arrange: function (FolderItem)
		{
			this.tid = null;

			if (!FolderItem) {
				var FV = te.Ctrl(CTRL_FV);
				if (FV) {
					FolderItem = FV.FolderItem;
				}
			}
			if (FolderItem) {
				var bRoot = api.ILIsEmpty(FolderItem);
				var s = [];
				var o = document.getElementById("breadcrumbbuttons");
				var oAddr = document.F.addressbar;
				var width = oAddr.offsetWidth - 32;
				var height = oAddr.offsetHeight - 6;
				if (Addons.AddressBar.bXP) {
					oAddr.style.color = "windowtext";
				}
				else {
					var n = 0;
					do {
						if (n || api.GetAttributesOf(FolderItem, SFGAO_HASSUBFOLDER)) {
							s.unshift('<span id="addressbar' + n + '" class="button" style="font-family: webdings; line-height: ' + height + 'px; vertical-align: middle" onclick="Addons.AddressBar.Popup(this,' + n + ')" onmouseover="MouseOver(this)" onmouseout="MouseOut()" oncontextmenu="Addons.AddressBar.Exec(); return false;">4</span>');
						}
						s.unshift('<span class="button" style="line-height: ' + height + 'px" onclick="Addons.AddressBar.Go(' + n + ')" onmouseover="MouseOver(this)" onmouseout="MouseOut()" oncontextmenu="Addons.AddressBar.Exec(); return false;">' + api.GetDisplayNameOf(FolderItem, SHGDN_INFOLDER) + '</span>');
						FolderItem = api.ILRemoveLastID(FolderItem);
						o.innerHTML = s.join("");
						if (o.offsetWidth > width && n > 0) {
							s.splice(0, 2);
							o.innerHTML = s.join("");
							break;
						}
						n++;
					} while (!api.ILIsEmpty(FolderItem));
					if (api.ILIsEmpty(FolderItem)) {
						if (!bRoot) {
							o.insertAdjacentHTML("AfterBegin", '<span id="addressbar' + n + '" class="button" style="font-family: webdings; line-height: ' + height + 'px" onclick="Addons.AddressBar.Popup(this, ' + n + ')" onmouseover="MouseOver(this)" onmouseout="MouseOut()">4</span>');
						}
					}
					else {
						o.insertAdjacentHTML("AfterBegin", '<span id="addressbar' + n + '" class="button" style="line-height: ' + height + 'px" onclick="Addons.AddressBar.Popup2(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">&laquo;</span>');
					}
					this.nLevel = n;
				}
				var o = document.getElementById("addressbarselect");
				o.style.left = (width + 16) + "px";
				o.style.lineHeight = Math.abs(oAddr.offsetHeight - 6) + "px";
				var img = document.getElementById("addr_img");
				img.style.top = Math.abs(oAddr.offsetHeight - 16) / 2 + "px";
			}
		},

		Exec: function ()
		{
			document.F.addressbar.focus();
			return S_OK;
		},

		Focus: function (o)
		{
			o.select();
			o.style.color = "windowtext";
			document.getElementById("breadcrumbbuttons").style.display = "none";
		},

		Blur: function (o)
		{
			o.value = o.value;
			if (!Addons.AddressBar.bXP) {
				o.style.color = "window";
				document.getElementById("breadcrumbbuttons").style.display = "inline-block";
			}
		},

		Go: function (n)
		{
			Navigate(this.GetPath(n), GetNavigateFlags());
		},

		GetPath: function(n)
		{
			var FV = te.Ctrl(CTRL_FV);
			if (FV) {
				FolderItem = FV.FolderItem;
			}
			while (n--) {
				FolderItem = api.ILRemoveLastID(FolderItem);
			}
			return FolderItem;
		},

		Popup: function (o, n)
		{
			if (Addons.AddressBar.CanPopup()) {
				Addons.AddressBar.Item = o;
				var pt = GetPos(o, true);
				MouseOver(o);
				FolderMenu.Invoke(FolderMenu.Open(this.GetPath(n), pt.x, pt.y + o.offsetHeight * screen.deviceXDPI / 96));
			}
		},

		Popup2: function (o)
		{
			var FV = te.Ctrl(CTRL_FV);
			if (FV) {
				var FolderItem = FV.FolderItem;
				FolderMenu.Clear();
				var hMenu = api.CreatePopupMenu();
				while (!api.ILIsEmpty(FolderItem)) {
					FolderItem = api.ILRemoveLastID(FolderItem);
					FolderMenu.AddMenuItem(hMenu, FolderItem);
				}
				Addons.AddressBar.Item = o;
				Addons.AddressBar.bLoop = true;
				ExitMenuLoop = function () {
					Addons.AddressBar.bLoop = false;
				};
				MouseOver(o);
				var pt = GetPos(o, true);
				window.g_menu_click = true;
				var nVerb = api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y + o.offsetHeight, te.hwnd, null, null);
				api.DestroyMenu(hMenu);
				FolderItem = null;
				if (nVerb) {
					FolderItem = FolderMenu.Items[nVerb - 1];
				}
				FolderMenu.Clear();
				FolderMenu.Invoke(FolderItem);
			}
		},
		
		Popup3: function (o)
		{
			if (Addons.AddressBar.CanPopup()) {
				FolderMenu.Clear();
				var hMenu = api.CreatePopupMenu();
				FolderMenu.AddMenuItem(hMenu, api.ILCreateFromPath(ssfDESKTOP));
				FolderMenu.AddMenuItem(hMenu, api.ILCreateFromPath(ssfDRIVES), api.GetDisplayNameOf(ssfDRIVES, SHGDN_INFOLDER), true);
				var Items = sha.NameSpace(ssfDRIVES).Items();
				for (var i = 0; i < Items.Count; i++) {
					var path = api.GetDisplayNameOf(Items.Item(i), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
					if (path) {
						FolderMenu.AddMenuItem(hMenu, Items.Item(i));
					}
				}
				FolderMenu.AddMenuItem(hMenu, api.ILCreateFromPath(ssfBITBUCKET), api.GetDisplayNameOf(ssfBITBUCKET, SHGDN_INFOLDER), true);

				var pt = GetPos(o, true);
				window.g_menu_click = true;
				var nVerb = api.TrackPopupMenuEx(hMenu, TPM_RIGHTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x + o.offsetWidth * screen.deviceXDPI / 96, pt.y + o.offsetHeight * screen.deviceYDPI / 96, te.hwnd, null, null);
				api.DestroyMenu(hMenu);
				FolderItem = null;
				if (nVerb) {
					FolderItem = FolderMenu.Items[nVerb - 1];
				}
				FolderMenu.Clear();
				FolderMenu.Invoke(FolderItem);
			}
		},

		CanPopup: function ()
		{
			if (!Addons.AddressBar.bClose) {
				Addons.AddressBar.bLoop = true;
				AddEvent("ExitMenuLoop", function () {
					Addons.AddressBar.bLoop = false;
					Addons.AddressBar.bClose = true;
					clearTimeout(Addons.AddressBar.tid2);
					Addons.AddressBar.tid2 = setTimeout("Addons.AddressBar.bClose = false;", 500);

				});
				return true;
			}
			return false;
		}
	};


	AddEvent("ChangeView", function (Ctrl)
	{
		if (Ctrl.FolderItem && Ctrl.Id == Ctrl.Parent.Selected.Id && Ctrl.Parent.Id == te.Ctrl(CTRL_TC).Id) {
			document.F.addressbar.value = api.GetDisplayNameOf(Ctrl.FolderItem, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
			Addons.AddressBar.Arrange(Ctrl.FolderItem);
			document.getElementById("addr_img").src = GetIconImage(Ctrl, api.GetSysColor(COLOR_WINDOW));
		}
	});

	AddEvent("Resize", function ()
	{
		Addons.AddressBar.Arrange();
	});

	AddEvent("MouseMessage", function (Ctrl, hwnd, msg, mouseData, pt, wHitTestCode, dwExtraInfo)
	{
		if (msg == WM_MOUSEMOVE && Ctrl.Type == CTRL_TE && Addons.AddressBar.bLoop) {
			var Ctrl2 = te.CtrlFromPoint(pt);
			if (Ctrl2 && Ctrl2.Type == CTRL_WB && !HitTest(Addons.AddressBar.Item, pt)) {
				for (var i = Addons.AddressBar.nLevel; i >= 0; i--) {
					var o = document.getElementById("addressbar" + i);
					if (o) {
						if (HitTest(o, pt)) {
							wsh.SendKeys("{Esc}");
							(function (o) { setTimeout(function () {
								Addons.AddressBar.bClose = false;
								o.click();
							}, 99);}) (o);
						}
					}
				}
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

	if (items.length) {
		Addons.AddressBar.bXP = item.getAttribute("XP");
		//Menu
		if (item.getAttribute("MenuExec")) {
			Addons.AddressBar.nPos = api.LowPart(item.getAttribute("MenuPos"));
			var s = item.getAttribute("MenuName");
			if (s && s != "") {
				Addons.AddressBar.strName = s;
			}
			AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
			{
				api.InsertMenu(hMenu, Addons.AddressBar.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Addons.AddressBar.strName));
				ExtraMenuCommand[nPos] = Addons.AddressBar.Exec;
				return nPos;
			});
		}
		//Key
		if (item.getAttribute("KeyExec")) {
			SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.AddressBar.Exec, "Func");
		}
		//Mouse
		if (item.getAttribute("MouseExec")) {
			SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.AddressBar.Exec, "Func");
		}
	}
	AddTypeEx("Add-ons", "Address Bar", Addons.AddressBar.Exec);

	var s = item.getAttribute("Width");
	if (s) {
		s = (api.QuadPart(s) == s) ? (s + "px") : s;
	}
	else {
		s = "100%";
	}
	s = ['<div style="position: relative; width; 100px; overflow: hidden"><div id="breadcrumbbuttons" style="margin 2px; background-color: window; white-space: nowrap; position: absolute; left: 2px; top: 2px; padding-left: 20px"></div><input id="addressbar" type="text" onkeydown="return Addons.AddressBar.KeyDown(this)" onfocus="Addons.AddressBar.Focus(this)" onblur="Addons.AddressBar.Blur(this)" onresize="Addons.AddressBar.Resize()" style="width: ', s.replace(/;"<>/g, ''), '; vertical-align: middle; color: window; padding-left: 20px; padding-right: 16px;"><div id="addressbarselect" class="button" style="position: absolute; font-family: webdings; top: 2px" onmouseover="MouseOver(this);" onmouseout="MouseOut()" onclick="Addons.AddressBar.Popup3(this)">6</span></div>'];
	
	s.push('<img id="addr_img" src="icon:shell32.dll,3,16"');
	s.push(' onclick="return Addons.AddressBar.Exec();"');
	s.push(' oncontextmenu="Addons.AddressBar.Exec(); return false;"');
	s.push(' style="position: absolute; left: 4px; top: 2px; width: 16px; height: 16px; z-index: 3; border: 0px" /></div>');

	var o = document.getElementById(SetAddon(Addon_Id, Default, s));
	if (o.style.verticalAlign.length == 0) {
		o.style.verticalAlign = "middle";
	}
	Addons.AddressBar.Resize();
}
else {
	document.getElementById("tab0").value = GetText("General");
	document.getElementById("panel0").innerHTML = ['<table style="width: 100%"><tr><td><input type="checkbox" id="XP" /><label for="XP">XP ', GetText("Style").toLowerCase(), '</label></td></tr><tr><td><label>', GetText("Width"), '</label></td></tr><tr><td><input type="text" name="Width" size="10" /></td><td><input type="button" value="', GetText("Auto"), '" onclick="document.F.Width.value=\'\'" /></td></tr></table>'].join("");
}
