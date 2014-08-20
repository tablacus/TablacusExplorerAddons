var Addon_Id = "breadcrumbsaddressbar";
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
	Addons.BreadcrumbsAddressBar =
	{
		tid: null,
		Item: null,
		bLoop: false,
		nLevel: 0,
		tid2: null,
		bClose: false,
		nPos: 0,
		strName: "Breadcrumbs Address Bar",

		KeyDown: function (o)
		{
			if (event.keyCode == VK_RETURN) {
				var o = document.F.breadcrumbsaddressbar;
				var p = GetPos(o);
				var pt = api.Memory("POINT");
				pt.x = screenLeft + p.x;
				pt.y = screenTop + p.y + o.offsetHeight;
				window.Input = o.value;
				if (ExecMenu(te.Ctrl(CTRL_WB), "Alias", pt, 2) != S_OK) {
					Navigate(o.value, OpenMode);
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
				var o = document.getElementById("breadcrumbsbuttons");
				var oAddr = document.F.breadcrumbsaddressbar;
				var width = oAddr.offsetWidth - 32;
				var height = oAddr.offsetHeight - 6;
				var n = 0;
				do {
					if (n || api.GetAttributesOf(FolderItem, SFGAO_HASSUBFOLDER)) {
						s.unshift('<span id="breadcrumbsaddressbar' + n + '" class="button" style="font-family: webdings; line-height: ' + height + 'px; vertical-align: middle" onclick="Addons.BreadcrumbsAddressBar.Popup(this,' + n + ')" onmouseover="MouseOver(this)" onmouseout="MouseOut()" oncontextmenu="Addons.BreadcrumbsAddressBar.Exec(); return false;">4</span>');
					}
					s.unshift('<span class="button" style="line-height: ' + height + 'px" onclick="Addons.BreadcrumbsAddressBar.Go(' + n + ')" onmouseover="MouseOver(this)" onmouseout="MouseOut()" oncontextmenu="Addons.BreadcrumbsAddressBar.Exec(); return false;">' + api.GetDisplayNameOf(FolderItem, SHGDN_INFOLDER) + '</span>');
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
						o.insertAdjacentHTML("AfterBegin", '<span id="breadcrumbsaddressbar' + n + '" class="button" style="font-family: webdings; line-height: ' + height + 'px" onclick="Addons.BreadcrumbsAddressBar.Popup(this, ' + n + ')" onmouseover="MouseOver(this)" onmouseout="MouseOut()">4</span>');
					}
				}
				else {
					o.insertAdjacentHTML("AfterBegin", '<span id="breadcrumbsaddressbar' + n + '" class="button" style="line-height: ' + height + 'px" onclick="Addons.BreadcrumbsAddressBar.Popup2(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">&laquo;</span>');
				}
				this.nLevel = n;
				var o = document.getElementById("breadcrumbsselect");
				o.style.left = (width + 16) + "px";
				o.style.lineHeight = Math.abs(oAddr.offsetHeight - 6) + "px";
				var img = document.getElementById("breadcrumbsaddr_img");
				img.style.top = Math.abs(oAddr.offsetHeight - 16) / 2 + "px";
			}
		},

		Exec: function ()
		{
			document.F.breadcrumbsaddressbar.focus();
			return S_OK;
		},

		Focus: function (o)
		{
			o.select();
			o.style.color = "windowtext";
			document.getElementById("breadcrumbsbuttons").style.display = "none";
		},

		Blur: function (o)
		{
			o.style.color = "window";
			document.getElementById("breadcrumbsbuttons").style.display = "inline-block";
		},

		Go: function (n)
		{
			Navigate(this.GetPath(n), OpenMode);
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
			if (!Addons.BreadcrumbsAddressBar.bClose) {
				Addons.BreadcrumbsAddressBar.Item = o;
				var pt = GetPos(o, true);
				Addons.BreadcrumbsAddressBar.bLoop = true;
				AddEvent("ExitMenuLoop", function () {
					Addons.BreadcrumbsAddressBar.bLoop = false;
					Addons.BreadcrumbsAddressBar.bClose = true;
					clearTimeout(Addons.BreadcrumbsAddressBar.tid2);
					Addons.BreadcrumbsAddressBar.tid2 = setTimeout("Addons.BreadcrumbsAddressBar.bClose = false;", 500);

				});
				MouseOver(o);
				FolderMenu.Invoke(FolderMenu.Open(this.GetPath(n), pt.x, pt.y + o.offsetHeight));
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
				Addons.BreadcrumbsAddressBar.Item = o;
				Addons.BreadcrumbsAddressBar.bLoop = true;
				ExitMenuLoop = function () {
					Addons.BreadcrumbsAddressBar.bLoop = false;
				};
				MouseOver(o);
				var pt = GetPos(o, true);
				window.g_menu_click = true;
				var nVerb = api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y + o.offsetHeight, external.hwnd, null, null);
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
			var nVerb = api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y + o.offsetHeight, external.hwnd, null, null);
			api.DestroyMenu(hMenu);
			FolderItem = null;
			if (nVerb) {
				FolderItem = FolderMenu.Items[nVerb - 1];
			}
			FolderMenu.Clear();
			FolderMenu.Invoke(FolderItem);
		}

	};


	AddEvent("ChangeView", function (Ctrl)
	{
		if (Ctrl.FolderItem && Ctrl.Id == Ctrl.Parent.Selected.Id && Ctrl.Parent.Id == te.Ctrl(CTRL_TC).Id) {
			document.F.breadcrumbsaddressbar.value = api.GetDisplayNameOf(Ctrl.FolderItem, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
			Addons.BreadcrumbsAddressBar.Arrange(Ctrl.FolderItem);
			if (document.documentMode) {
				var info = api.Memory("SHFILEINFO");
				api.ShGetFileInfo(Ctrl.FolderItem, 0, info, info.Size, SHGFI_ICON | SHGFI_SMALLICON | SHGFI_PIDL);
				var image = te.GdiplusBitmap();
				image.FromHICON(info.hIcon, api.GetSysColor(COLOR_WINDOW));
				api.DestroyIcon(info.hIcon);
				document.getElementById("breadcrumbsaddr_img").src = image.DataURI("image/png");
			}
		}
	});

	AddEvent("Resize", function ()
	{
		Addons.BreadcrumbsAddressBar.Arrange();
	});

	AddEvent("MouseMessage", function (Ctrl, hwnd, msg, mouseData, pt, wHitTestCode, dwExtraInfo)
	{
		if (msg == WM_MOUSEMOVE && Ctrl.Type == CTRL_TE && Addons.BreadcrumbsAddressBar.bLoop) {
			var Ctrl2 = te.CtrlFromPoint(pt);
			if (Ctrl2 && Ctrl2.Type == CTRL_WB && !HitTest(Addons.BreadcrumbsAddressBar.Item, pt)) {
				for (var i = Addons.BreadcrumbsAddressBar.nLevel; i >= 0; i--) {
					var o = document.getElementById("breadcrumbsaddressbar" + i);
					if (o) {
						if (HitTest(o, pt)) {
							wsh.SendKeys("{Esc}");
							(function (o) { setTimeout(function () {
								Addons.BreadcrumbsAddressBar.bClose = false;
								o.click();
							}, 100);}) (o);
						}
					}
				}
			}
		}
	});

	AddEvent("SetAddress", function (s)
	{
		document.F.breadcrumbsaddressbar.value = s;
	});

	GetAddress = function ()
	{
		return document.F.breadcrumbsaddressbar.value;
	}

	if (items.length) {
		//Menu
		if (item.getAttribute("MenuExec")) {
			Addons.BreadcrumbsAddressBar.nPos = api.LowPart(item.getAttribute("MenuPos"));
			var s = item.getAttribute("MenuName");
			if (s && s != "") {
				Addons.BreadcrumbsAddressBar.strName = s;
			}
			AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
			{
				api.InsertMenu(hMenu, Addons.BreadcrumbsAddressBar.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Addons.BreadcrumbsAddressBar.strName));
				ExtraMenuCommand[nPos] = Addons.BreadcrumbsAddressBar.Exec;
				return nPos;
			});
		}
		//Key
		if (item.getAttribute("KeyExec")) {
			SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.BreadcrumbsAddressBar.Exec, "Func");
		}
		//Mouse
		if (item.getAttribute("MouseExec")) {
			SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.BreadcrumbsAddressBar.Exec, "Func");
		}
	}
	AddTypeEx("Add-ons", "Breadcrumbs Address Bar", Addons.BreadcrumbsAddressBar.Exec);

	var s = ['<div style="position: relative; width; 100px; overflow: hidden"><div id="breadcrumbsbuttons" style="margin 2px; background-color: window; white-space: nowrap; position: absolute; left: 2px; top: 2px; padding-left: 20px"></div><input id="breadcrumbsaddressbar" type="text" onkeydown="return Addons.BreadcrumbsAddressBar.KeyDown(this)" onfocus="Addons.BreadcrumbsAddressBar.Focus(this)" onblur="Addons.BreadcrumbsAddressBar.Blur(this)" onresize="Addons.BreadcrumbsAddressBar.Resize()" style="width: 100%; vertical-align: middle; color: window; padding-left: 20px; padding-right: 16px;"><div id="breadcrumbsselect" class="button" style="position: absolute; font-family: webdings; top: 2px" onmouseover="MouseOver(this);" onmouseout="MouseOut()" onclick="Addons.BreadcrumbsAddressBar.Popup3(this)">6</span></div>'];
	
	s.push('<img id="breadcrumbsaddr_img" src="icon:shell32.dll,3,16"');
	s.push(' onclick="return Addons.BreadcrumbsAddressBar.Exec();"');
	s.push(' oncontextmenu="Addons.BreadcrumbsAddressBar.Exec(); return false;"');
	s.push(' style="position: absolute; left: 4px; top: 2px; width: 16px; height: 16px; z-index: 3; border: 0px" /></div>');

	var o = document.getElementById(SetAddon(Addon_Id, Default, s));
	if (o.style.verticalAlign.length == 0) {
		o.style.verticalAlign = "middle";
	}
	Addons.BreadcrumbsAddressBar.Resize();
}
