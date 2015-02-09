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
		Item: null,
		nLoopId: 0,
		nLevel: 0,
		tid2: false,
		path2: [],
		bClose: false,
		nPos: 0,
		strName: "Inner Address Bar",

		KeyDown: function (o, Id)
		{
			if (event.keyCode == VK_RETURN) {
				var p = GetPos(o);
				var pt = api.Memory("POINT");
				pt.x = screenLeft + p.x;
				pt.y = screenTop + p.y + o.offsetHeight * screen.deviceYDPI / 96;
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
			this.tid[Id] = setTimeout("Addons.InnerAddressBar.Arrange(null, " + Id + ");", 500);
		},

		Arrange: function (FolderItem, Id)
		{
			this.tid[Id] = null;
			if (!FolderItem) {
				var FV = GetInnerFV(CTRL_FV);
				if (FV && Id == FV.Parent.Id) {
					FolderItem = FV.FolderItem;
				}
			}
			if (FolderItem) {
				var bRoot = api.ILIsEmpty(FolderItem);
				var s = [];
				var oAddr = document.getElementById("inneraddressbar_" + Id);
				if (!oAddr) {
					return;
				}
				var width = oAddr.offsetWidth - 32;
				var height = oAddr.offsetHeight - 6;
				var o = document.getElementById("inneraddrselect_" + Id);
				o.style.left = (width + 16) + "px";
				o.style.lineHeight = Math.abs(oAddr.offsetHeight - 6) + "px";
				var img = document.getElementById("inneraddr_img_" + Id);
				img.style.top = Math.abs(oAddr.offsetHeight - 16) / 2 + "px";
			}
		},

		Focus: function (o, Id)
		{
			Activate(o, Id);
			o.select();
			o.style.color = "windowtext";
		},

		Blur: function (o, Id)
		{
			o.style.color = "windowtext";
			o.value = o.value;
		},

		Go: function (n, Id)
		{
			var FV = GetInnerFV(Id);
			NavigateFV(FV, this.GetPath(n, Id), OpenMode);
		},

		GetPath: function(n, Id)
		{
			var FV = GetInnerFV(Id);
			if (FV) {
				FolderItem = FV.FolderItem;
			}
			while (n--) {
				FolderItem = api.ILRemoveLastID(FolderItem);
			}
			return FolderItem;
		},

		Popup: function (o, n, Id)
		{
			if (Addons.AddressBar.CanPopup(o, Id)) {
				Addons.InnerAddressBar.Item = o;
				var pt = GetPos(o, true);
				MouseOver(o);
				FolderMenu.Invoke(FolderMenu.Open(this.GetPath(n, Id), pt.x, pt.y + o.offsetHeight * screen.deviceYDPI / 96));
			}
		},

		Popup2: function (o, Id)
		{
			var FV = GetInnerFV(Id);
			if (FV) {
				var FolderItem = FV.FolderItem;
				FolderMenu.Clear();
				var hMenu = api.CreatePopupMenu();
				while (!api.ILIsEmpty(FolderItem)) {
					FolderItem = api.ILRemoveLastID(FolderItem);
					FolderMenu.AddMenuItem(hMenu, FolderItem);
				}
				Addons.InnerAddressBar.Item = o;
				Addons.InnerAddressBar.nLoopId = Id;
				ExitMenuLoop = function () {
					Addons.InnerAddressBar.nLoopId = 0;
				};
				MouseOver(o);
				var pt = GetPos(o, true);
				window.g_menu_click = true;
				var nVerb = api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y + o.offsetHeight * screen.deviceYDPI / 96, te.hwnd, null, null);
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
			if (Addons.InnerAddressBar.CanPopup(o, Id)) {
				var FV = GetInnerFV(Id);
				if (FV) {
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
			}
		},

		CanPopup: function (o, Id)
		{
			if (!Addons.InnerAddressBar.bClose) {
				Addons.InnerAddressBar.nLoopId = Id;
				Addons.InnerAddressBar.bLoop = true;
				AddEvent("ExitMenuLoop", function () {
					Addons.InnerAddressBar.nLoopId = 0;
					Addons.InnerAddressBar.bLoop = false;
					Addons.InnerAddressBar.bClose = true;
					clearTimeout(Addons.InnerAddressBar.tid2);
					Addons.InnerAddressBar.tid2 = setTimeout("Addons.InnerAddressBar.bClose = false;", 500);

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
				Addons.InnerAddressBar.ExecEx(TC.Id);
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
				document.getElementById("inneraddressbar_" + Id).focus();
			}
			return S_OK;
		}

	};

	AddEvent("ChangeView", function (Ctrl)
	{
		if (Ctrl.FolderItem && Ctrl.Id == Ctrl.Parent.Selected.Id) {
			var Id = Ctrl.Parent.Id;
			var path = api.GetDisplayNameOf(Ctrl.FolderItem, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
			Addons.InnerAddressBar.path2[Id] = path
			var o = document.getElementById("inneraddressbar_" + Id);
			if (o) {
				o.value = path;
			}
			Addons.InnerAddressBar.Arrange(Ctrl.FolderItem, Id);
			o = document.getElementById("inneraddr_img_" + Id);
			if (o) {
				o.src = GetIconImage(Ctrl, api.GetSysColor(COLOR_WINDOW));
			}
		}
	});

	AddEvent("PanelCreated", function (Ctrl)
	{
		var s = (Addons.InnerAddressBar.path2[Ctrl.Id] || "").replace(/"/, "");
		s = ['<div style="position: relative; width; 100px; overflow: hidden"><input id="inneraddressbar_$" type="text" value="' + s + '" onkeydown="return Addons.InnerAddressBar.KeyDown(this, $)" onfocus="Addons.InnerAddressBar.Focus(this, $)" onblur="Addons.InnerAddressBar.Blur(this, $)" onresize="Addons.InnerAddressBar.Resize($)" style="width: 100%; vertical-align: middle; padding-left: 20px; padding-right: 16px;"><div id="inneraddrselect_$" class="button" style="position: absolute; font-family: webdings; top: 2px" onmouseover="MouseOver(this);" onmouseout="MouseOut()" onclick="Addons.InnerAddressBar.Popup3(this, $)">6</span></div>'];
		s.push('<img id="inneraddr_img_$" src="icon:shell32.dll,3,16"');
		s.push(' onclick="return Addons.InnerAddressBar.ExecEx($);"');
		s.push(' oncontextmenu="Addons.InnerAddressBar.ExecEx($); return false;"');
		s.push(' style="position: absolute; left: 4px; top: 2px; width: 16px; height: 16px; z-index: 3; border: 0px" /></div>');
		SetAddon(null, "Inner1Center_" + Ctrl.Id, s.join("").replace(/\$/g, Ctrl.Id));
	});

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
