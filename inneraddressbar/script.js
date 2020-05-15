var Addon_Id = "inneraddressbar";

var item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("Menu", "Edit");
	item.setAttribute("MenuPos", -1);

	item.setAttribute("KeyExec", 1);
	item.setAttribute("KeyOn", "All");
	item.setAttribute("Key", "Alt+D");
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
		strName: "Inner address bar",

		KeyDown: function (o, Id)
		{
			if (event.keyCode == VK_RETURN) {
				(function (o, Id, str) {
					setTimeout(function () {
						if (str == o.value) {
							var p = GetPos(o);
							var pt = api.Memory("POINT");
							pt.x = screenLeft + p.x;
							pt.y = screenTop + p.y + o.offsetHeight;
							window.Input = o.value;
							if (ExecMenu(te.Ctrl(CTRL_WB), "Alias", pt, 2) != S_OK) {
								NavigateFV(GetInnerFV(Id), o.value, GetNavigateFlags(), true);
							}
						}
					}, 99);
				})(o, Id, o.value);
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
				var TC = te.Ctrl(CTRL_TC, Id);
				if (TC && TC.Selected) {
					FolderItem = TC.Selected.FolderItem;
				}
			}
			if (FolderItem) {
				var bRoot = api.ILIsEmpty(FolderItem);
				var s = [];
				var oAddr = document.getElementById("inneraddressbar_" + Id);
				if (!oAddr) {
					return;
				}
				var height = oAddr.offsetHeight - 6;
				var oPopup = document.getElementById("inneraddrselect_" + Id);
				oPopup.style.left = (oAddr.offsetWidth - oPopup.offsetWidth - 1) + "px";
				oPopup.style.lineHeight = Math.abs(oAddr.offsetHeight - 6) + "px";
				var oImg = document.getElementById("inneraddr_img_" + Id);
				oImg.style.top = Math.abs(oAddr.offsetHeight - oImg.offsetHeight) / 2 + "px";
			}
		},

		Focus: function (o, Id)
		{
			Activate(o, Id);
			o.select();
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
				FolderMenu.Invoke(FolderMenu.Open(this.GetPath(n, Id), pt.x, pt.y + o.offsetHeight));
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
				var nVerb = FolderMenu.TrackPopupMenu(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y + o.offsetHeight);
				FolderItem = nVerb ? FolderMenu.Items[nVerb - 1] : null;
				FolderMenu.Clear();
				FolderMenu.Invoke(FolderItem, SBSP_SAMEBROWSER, FV);
			}
		},

		Popup3: function (o, Id)
		{
			if (Addons.InnerAddressBar.CanPopup(o, Id)) {
				var FV = GetInnerFV(Id);
				if (FV) {
					FolderMenu.Location(o);
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
		var nSize = api.GetSystemMetrics(SM_CYSMICON);
		var s = (Addons.InnerAddressBar.path2[Ctrl.Id] || "").replace(/"/, "");
		s = ['<div style="position: relative; width; 100px; overflow: hidden"><input id="inneraddressbar_$" type="text" value="' + s + '" autocomplate="on" list="AddressList" onkeydown="return Addons.InnerAddressBar.KeyDown(this, $)" oninput="AdjustAutocomplete(this.value)" onfocus="Addons.InnerAddressBar.Focus(this, $)" onresize="Addons.InnerAddressBar.Resize($)" style="width: 100%; vertical-align: middle; padding-left: ', nSize + 4, 'px; padding-right: 16px;"><div id="inneraddrselect_$" class="button" style="position: absolute; top: 1px" onmouseover="MouseOver(this);" onmouseout="MouseOut()" onclick="Addons.InnerAddressBar.Popup3(this, $)">', BUTTONS.dropdown, '</span></div>'];
		s.push('<img id="inneraddr_img_$" src="icon:shell32.dll,3,16"');
		s.push(' onclick="return Addons.InnerAddressBar.ExecEx($);"');
		s.push(' oncontextmenu="Addons.InnerAddressBar.ExecEx($); return false;"');
		s.push(' style="position: absolute; left: 4px; top: 1.5pt; width: ', nSize, 'px; height: ', nSize, 'px; z-index: 3; border: 0px"></div>');
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
} else {
	SetTabContents(0, "General", '<label><input type="checkbox" id="!NoAutocomplete">Autocomplete</label>');
}
