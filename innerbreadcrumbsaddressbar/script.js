var Addon_Id = "innerbreadcrumbsaddressbar";

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
	Addons.InnerBreadcrumbsAddressBar =
	{
		tid: [],
		Item: null,
		nLoopId: 0,
		nLevel: 0,
		tid2: false,
		path2: [],
		bClose: false,
		nPos: 0,
		strName: "Inner Breadcrumbs Address Bar",

		KeyDown: function (o, Id)
		{
			if (event.keyCode == VK_RETURN) {
				var p = GetPos(o);
				var pt = api.Memory("POINT");
				pt.x = screenLeft + p.x;
				pt.y = screenTop + p.y + o.offsetHeight * screen.deviceYDPI / screen.logicalYDPI;
				window.Input = o.value;
				if (ExecMenu(te.Ctrl(CTRL_WB), "Alias", pt, 2) != S_OK) {
					FV = GetInnerFV(Id);
					NavigateFV(FV, o.value, OpenMode);
				}
				return false;
			}
			return true;
		},

		Resize: function (Id)
		{
			clearTimeout(this.tid[Id]);
			this.tid[Id] = setTimeout("Addons.InnerBreadcrumbsAddressBar.Arrange(null, " + Id + ");", 500);
		},

		Arrange: function (FolderItem, Id)
		{
			this.tid[Id] = null;
			if (!FolderItem) {
				var TC = te.Ctrl(CTRL_TC, Id);
				if (TC && TC.Selected) {
					FolderItem = TC.Selected.FolderItem;
				}
			}
			if (FolderItem) {
				var bRoot = api.ILIsEmpty(FolderItem);
				var s = [];
				var o = document.getElementById("breadcrumbsbuttons_" + Id);
				var oAddr = document.getElementById("breadcrumbsaddressbar_" + Id);
				if (!oAddr) {
					return;
				}
				var oPopup = document.getElementById("breadcrumbsselect_" + Id);
				var oImg = document.getElementById("breadcrumbsaddr_img_" + Id);
				var width = oAddr.offsetWidth - oImg.offsetWidth + oPopup.offsetHeight - 2;
				var height = oAddr.offsetHeight - (6 * screen.deviceYDPI / 96);
				var n = 0;
				do {
					if (n || api.GetAttributesOf(FolderItem, SFGAO_HASSUBFOLDER)) {
						s.unshift('<span id="breadcrumbsaddressbar_' + Id + "_"  + n + '" class="button" style="line-height: ' + height + 'px; vertical-align: middle" onclick="Addons.InnerBreadcrumbsAddressBar.Popup(this,' + n + ', ' + Id + ')" onmouseover="MouseOver(this)" onmouseout="MouseOut()" oncontextmenu="Addons.InnerBreadcrumbsAddressBar.Exec(' + Id + '); return false;">' + BUTTONS.next + '</span>');
					}
					s.unshift('<span class="button" style="line-height: ' + height + 'px" onclick="Addons.InnerBreadcrumbsAddressBar.Go(' + n + ', ' + Id + ')" onmousedown="Addons.InnerBreadcrumbsAddressBar.GoNew(' + n + ', ' + Id + ')" onmouseover="MouseOver(this)" onmouseout="MouseOut()" oncontextmenu="Addons.InnerBreadcrumbsAddressBar.Exec(' + Id + '); return false;">' + api.GetDisplayNameOf(FolderItem, SHGDN_INFOLDER) + '</span>');
					FolderItem = api.ILGetParent(FolderItem);
					o.innerHTML = s.join("");
					if (o.offsetWidth > width && n > 0) {
						s.splice(0, 2);
						o.innerHTML = s.join("");
						break;
					}
					n++;
				} while (!api.ILIsEmpty(FolderItem) && n < 99);
				if (api.ILIsEmpty(FolderItem)) {
					if (!bRoot) {
						o.insertAdjacentHTML("AfterBegin", '<span id="breadcrumbsaddressbar_' + Id + '_' + n + '" class="button" style="line-height: ' + height + 'px" onclick="Addons.InnerBreadcrumbsAddressBar.Popup(this, ' + n + ', ' + Id + ')" onmouseover="MouseOver(this)" onmouseout="MouseOut()">' + BUTTONS.next + '</span>');
					}
				}
				else {
					o.insertAdjacentHTML("AfterBegin", '<span id="breadcrumbsaddressbar_' + Id + '_' + n + '" class="button" style="line-height: ' + height + 'px" onclick="Addons.InnerBreadcrumbsAddressBar.Popup2(this, ' + Id + ')" onmouseover="MouseOver(this)" onmouseout="MouseOut()">' + BUTTONS.parent + '</span>');
				}
				this.nLevel = n;
				oPopup.style.left = (oAddr.offsetWidth - oPopup.offsetWidth - 1) + "px";
				oPopup.style.lineHeight = Math.abs(oAddr.offsetHeight - 6) + "px";
				oImg.style.top = Math.abs(oAddr.offsetHeight - oImg.offsetHeight) / 2 + "px";
			}
		},

		Focus: function (o, Id)
		{
			Activate(o, Id);
			o.select();
			o.style.color = "windowtext";
			document.getElementById("breadcrumbsbuttons_" + Id).style.display = "none";
		},

		Blur: function (o, Id)
		{
			o.style.color = "window";
			document.getElementById("breadcrumbsbuttons_" + Id).style.display = "inline-block";
		},

		GoNew: function (n, Id)
		{
			if (api.GetKeyState(VK_MBUTTON) < 0) {
				Addons.InnerBreadcrumbsAddressBar.Go(n, Id);
			}
		},

		Go: function (n, Id)
		{
			var FV = GetInnerFV(Id);
			NavigateFV(FV, this.GetPath(n, Id), GetNavigateFlags());
		},

		GetPath: function(n, Id)
		{
			var FV = GetInnerFV(Id);
			if (FV) {
				FolderItem = FV.FolderItem;
			}
			while (n--) {
				FolderItem = api.ILGetParent(FolderItem);
			}
			return FolderItem;
		},

		Popup: function (o, n, Id)
		{
			if (Addons.InnerBreadcrumbsAddressBar.CanPopup(o, Id)) {
				Addons.InnerBreadcrumbsAddressBar.Item = o;
				var pt = GetPos(o, true);
				MouseOver(o);
				FolderMenu.Invoke(FolderMenu.Open(this.GetPath(n, Id), pt.x, pt.y + o.offsetHeight * screen.deviceYDPI / screen.logicalYDPI));
			}
		},

		Popup2: function (o, Id)
		{
			var FV = GetInnerFV(Id);
			if (FV) {
				var FolderItem = FV.FolderItem;
				FolderMenu.Clear();
				var hMenu = api.CreatePopupMenu();
				var n = 99;
				while (!api.ILIsEmpty(FolderItem) && n--) {
					FolderItem = api.ILGetParent(FolderItem);
					FolderMenu.AddMenuItem(hMenu, FolderItem);
				}
				Addons.InnerBreadcrumbsAddressBar.Item = o;
				Addons.InnerBreadcrumbsAddressBar.nLoopId = Id;
				ExitMenuLoop = function () {
					Addons.InnerBreadcrumbsAddressBar.nLoopId = 0;
				};
				MouseOver(o);
				var pt = GetPos(o, true);
				window.g_menu_click = true;
				var nVerb = api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y + o.offsetHeight * screen.deviceYDPI / screen.logicalYDPI, te.hwnd, null, null);
				api.DestroyMenu(hMenu);
				FolderItem = null;
				if (nVerb) {
					FolderItem = FolderMenu.Items[nVerb - 1];
				}
				FolderMenu.Clear();
				var FV = GetInnerFV(Id);
				FV.Focus();
				FolderMenu.Invoke(FolderItem);
			}
		},

		Popup3: function (o, Id)
		{
			if (Addons.InnerBreadcrumbsAddressBar.CanPopup(o, Id)) {
				var FV = GetInnerFV(Id);
				if (FV) {
					FolderMenu.Clear();
					var hMenu = api.CreatePopupMenu();
					FolderMenu.AddMenuItem(hMenu, api.ILCreateFromPath(ssfDESKTOP));
					FolderMenu.AddMenuItem(hMenu, api.ILCreateFromPath(ssfDRIVES));
					var path0 = api.GetDisplayNameOf(ssfDESKTOP, SHGDN_FORPARSING);
					var Items = sha.NameSpace(ssfDRIVES).Items();
					for (var i = 0; i < Items.Count; i++) {
						var Item = Items.Item(i);
						var path = api.GetDisplayNameOf(Item, SHGDN_FORPARSING);
						if (path && path != path0) {
							FolderMenu.AddMenuItem(hMenu, Item, null, true);
						}
					}
					FolderMenu.AddMenuItem(hMenu, api.ILCreateFromPath(ssfBITBUCKET), api.GetDisplayNameOf(ssfBITBUCKET, SHGDN_INFOLDER), true);

					var pt = GetPos(o, true);
					window.g_menu_click = true;
					var nVerb = api.TrackPopupMenuEx(hMenu, TPM_RIGHTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x + o.offsetWidth * screen.deviceXDPI / screen.logicalXDPI, pt.y + o.offsetHeight * screen.deviceYDPI / screen.logicalYDPI, te.hwnd, null, null);
					api.DestroyMenu(hMenu);
					FolderItem = null;
					if (nVerb) {
						FolderItem = FolderMenu.Items[nVerb - 1];
					}
					FolderMenu.Clear();
					FolderMenu.Invoke(FolderItem);
				}
			}
		},

		CanPopup: function (o, Id)
		{
			if (!Addons.InnerBreadcrumbsAddressBar.bClose) {
				Addons.InnerBreadcrumbsAddressBar.nLoopId = Id;
				Addons.InnerBreadcrumbsAddressBar.bLoop = true;
				AddEvent("ExitMenuLoop", function () {
					Addons.InnerBreadcrumbsAddressBar.nLoopId = 0;
					Addons.InnerBreadcrumbsAddressBar.bLoop = false;
					Addons.InnerBreadcrumbsAddressBar.bClose = true;
					clearTimeout(Addons.InnerBreadcrumbsAddressBar.tid2);
					Addons.InnerBreadcrumbsAddressBar.tid2 = setTimeout("Addons.InnerBreadcrumbsAddressBar.bClose = false;", 500);

				});
				Activate(o, Id);
				return true;
			}
			return false;
		},

		Exec: function ()
		{
			var TC = te.Ctrl(CTRL_TC);
			if (TC) {
				Addons.InnerBreadcrumbsAddressBar.ExecEx(TC.Id);
			}
			return S_OK;
		},

		ExecEx: function (Id)
		{
			if (isNaN(Id)) {
				var TC = te.Ctrl(CTRL_TC);
				if (TC) {
					Id = TC.Id;
				}
			}
			if (isFinite(Id)) {
				document.getElementById("breadcrumbsaddressbar_" + Id).focus();
			}
			return S_OK;
		}

	};

	AddEvent("ChangeView", function (Ctrl)
	{
		if (Ctrl.FolderItem && Ctrl.Id == Ctrl.Parent.Selected.Id) {
			var Id = Ctrl.Parent.Id;
			var path = api.GetDisplayNameOf(Ctrl.FolderItem, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
			Addons.InnerBreadcrumbsAddressBar.path2[Id] = path
			var o = document.getElementById("breadcrumbsaddressbar_" + Id);
			if (o) {
				o.value = path;
			}
			Addons.InnerBreadcrumbsAddressBar.Arrange(Ctrl.FolderItem, Id);
			o = document.getElementById("breadcrumbsaddr_img_" + Id);
			if (o) {
				o.src = GetIconImage(Ctrl, api.GetSysColor(COLOR_WINDOW));
			}
		}
	});

	AddEvent("MouseMessage", function (Ctrl, hwnd, msg, mouseData, pt, wHitTestCode, dwExtraInfo)
	{
		if (msg == WM_MOUSEMOVE && Ctrl.Type == CTRL_TE && Addons.InnerBreadcrumbsAddressBar.nLoopId) {
			var Ctrl2 = te.CtrlFromPoint(pt);
			if (Ctrl2 && Ctrl2.Type == CTRL_WB && !HitTest(Addons.InnerBreadcrumbsAddressBar.Item, pt)) {
				for (var i = Addons.InnerBreadcrumbsAddressBar.nLevel; i >= 0; i--) {
					var o = document.getElementById("breadcrumbsaddressbar_" + Addons.InnerBreadcrumbsAddressBar.nLoopId + "_" + i);
					if (o) {
						if (HitTest(o, pt)) {
							api.PostMessage(hwnd, WM_KEYDOWN, VK_ESCAPE, 0);
							(function (o, Id) { setTimeout(function () {
								Addons.InnerBreadcrumbsAddressBar.bClose = false;
								o.click();
							}, 99);}) (o);
						}
					}
				}
			}
		}
	});

	AddEvent("PanelCreated", function (Ctrl)
	{
		var s = (Addons.InnerBreadcrumbsAddressBar.path2[Ctrl.Id] || "").replace(/"/, "");
		s = ['<div style="position: relative; width; 100px; overflow: hidden"><div id="breadcrumbsbuttons_$" style="background-color: window; white-space: nowrap; position: absolute; top: 1px; left: 2px; padding-left: 20px"></div><input id="breadcrumbsaddressbar_$" type="text" value="' + s + '" onkeydown="return Addons.InnerBreadcrumbsAddressBar.KeyDown(this, $)" onfocus="Addons.InnerBreadcrumbsAddressBar.Focus(this, $)" onblur="Addons.InnerBreadcrumbsAddressBar.Blur(this, $)" onresize="Addons.InnerBreadcrumbsAddressBar.Resize($)" style="width: 100%; vertical-align: middle; color: window; padding-left: 20px; padding-right: 16px;"><div id="breadcrumbsselect_$" class="button" style="position: absolute; top: 1px" onmouseover="MouseOver(this);" onmouseout="MouseOut()" onclick="Addons.InnerBreadcrumbsAddressBar.Popup3(this, $)">', BUTTONS.dropdown, '</span></div>'];
		s.push('<img id="breadcrumbsaddr_img_$" src="icon:shell32.dll,3,16"');
		s.push(' onclick="return Addons.InnerBreadcrumbsAddressBar.ExecEx($);"');
		s.push(' oncontextmenu="Addons.InnerBreadcrumbsAddressBar.ExecEx($); return false;"');
		s.push(' style="position: absolute; left: 4px; top: 2px; width: 16px; height: 16px; z-index: 3; border: 0px" /></div>');
		SetAddon(null, "Inner1Center_" + Ctrl.Id, s.join("").replace(/\$/g, Ctrl.Id));
	});

	AddEvent("Arrange", function (Ctrl, rc)
	{
		if (Ctrl.Type == CTRL_TC) {
			if (Ctrl.Selected) {
				Addons.InnerBreadcrumbsAddressBar.Resize(Ctrl.Id);
			}
		}
	});

	if (items.length) {
		//Menu
		if (item.getAttribute("MenuExec")) {
			Addons.InnerBreadcrumbsAddressBar.nPos = api.LowPart(item.getAttribute("MenuPos"));
			var s = item.getAttribute("MenuName");
			if (s && s != "") {
				Addons.InnerBreadcrumbsAddressBar.strName = s;
			}
			AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
			{
				api.InsertMenu(hMenu, Addons.InnerBreadcrumbsAddressBar.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Addons.InnerBreadcrumbsAddressBar.strName));
				ExtraMenuCommand[nPos] = Addons.InnerBreadcrumbsAddressBar.Exec;
				return nPos;
			});
		}
		//Key
		if (item.getAttribute("KeyExec")) {
			SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.InnerBreadcrumbsAddressBar.Exec, "Func");
		}
		//Mouse
		if (item.getAttribute("MouseExec")) {
			SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.InnerBreadcrumbsAddressBar.Exec, "Func");
		}
	}
	AddTypeEx("Add-ons", "Inner Breadcrumbs Address Bar", Addons.InnerBreadcrumbsAddressBar.Exec);
}
