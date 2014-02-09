var Addon_Id = "breadcrumbsaddressbar";
var Default = "ToolBar2Center";

if (window.Addon == 1) {
	Addons.BreadCrumbsAddressBar =
	{
		tid: null,
		Item: null,
		bLoop: false,
		nLevel: 0,
		tid2: null,
		bClose: false,

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
						s.unshift('<span id="breadcrumbsaddressbar' + n + '" class="button" style="font-family: webdings; line-height: ' + height + 'px; vertical-align: middle" onclick="Addons.BreadCrumbsAddressBar.Popup(this,' + n + ')" onmouseover="MouseOver(this)" onmouseout="MouseOut()">4</span>');
					}
					s.unshift('<span class="button" style="line-height: ' + height + 'px" onclick="Addons.BreadCrumbsAddressBar.Go(' + n + ')" onmouseover="MouseOver(this)" onmouseout="MouseOut()">' + api.GetDisplayNameOf(FolderItem, SHGDN_INFOLDER) + '</span>');
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
						o.insertAdjacentHTML("AfterBegin", '<span id="breadcrumbsaddressbar' + n + '" class="button" style="font-family: webdings; line-height: ' + height + 'px" onclick="Addons.BreadCrumbsAddressBar.Popup(this, ' + n + ')" onmouseover="MouseOver(this)" onmouseout="MouseOut()">4</span>');
					}
				}
				else {
					o.insertAdjacentHTML("AfterBegin", '<span id="breadcrumbsaddressbar' + n + '" class="button" style="line-height: ' + height + 'px" onclick="Addons.BreadCrumbsAddressBar.Popup2(this)" onmouseover="MouseOver(this)" onmouseout="MouseOut()">&laquo;</span>');
				}
				this.nLevel = n;
				(function (o) { setTimeout(function () {
					var pt = GetPos(oAddr);
					o.style.left = (pt.x + 1) + "px";
					o.style.top = (pt.y + (oAddr.offsetHeight - o.offsetHeight) / 2) + "px";
				}, 100);}) (o);
			}
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
			document.getElementById("breadcrumbsbuttons").style.display = "inline";
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
			if (!Addons.BreadCrumbsAddressBar.bClose) {
				Addons.BreadCrumbsAddressBar.Item = o;
				var pt = GetPos(o, true);
				Addons.BreadCrumbsAddressBar.bLoop = true;
				AddEvent("ExitMenuLoop", function () {
					Addons.BreadCrumbsAddressBar.bLoop = false;
					Addons.BreadCrumbsAddressBar.bClose = true;
					clearTimeout(Addons.BreadCrumbsAddressBar.tid2);
					Addons.BreadCrumbsAddressBar.tid2 = setTimeout("Addons.BreadCrumbsAddressBar.bClose = false;", 500);

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
				Addons.BreadCrumbsAddressBar.Item = o;
				Addons.BreadCrumbsAddressBar.bLoop = true;
				ExitMenuLoop = function () {
					Addons.BreadCrumbsAddressBar.bLoop = false;
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
		}
	};

	AddEvent("ChangeView", function (Ctrl)
	{
		if (Ctrl.FolderItem && Ctrl.Id == Ctrl.Parent.Selected.Id && Ctrl.Parent.Id == te.Ctrl(CTRL_TC).Id) {
			document.F.breadcrumbsaddressbar.value = api.GetDisplayNameOf(Ctrl.FolderItem, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
			Addons.BreadCrumbsAddressBar.Arrange(Ctrl.FolderItem);
		}
	});

	AddEvent("Resize", function ()
	{
		Addons.BreadCrumbsAddressBar.Arrange();
	});

	AddEvent("MouseMessage", function (Ctrl, hwnd, msg, mouseData, pt, wHitTestCode, dwExtraInfo)
	{
		if (msg == WM_MOUSEMOVE && Ctrl.Type == CTRL_TE && Addons.BreadCrumbsAddressBar.bLoop) {
			var Ctrl2 = te.CtrlFromPoint(pt);
			if (Ctrl2 && Ctrl2.Type == CTRL_WB && !HitTest(Addons.BreadCrumbsAddressBar.Item, pt)) {
				for (var i = Addons.BreadCrumbsAddressBar.nLevel; i >= 0; i--) {
					var o = document.getElementById("breadcrumbsaddressbar" + i);
					if (o) {
						if (HitTest(o, pt)) {
							wsh.SendKeys("{Esc}");
							(function (o) { setTimeout(function () {
								Addons.BreadCrumbsAddressBar.bClose = false;
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

	var s = ['<span id="breadcrumbsbuttons" style="margin 2px; background-color: window; white-space: nowrap; position: absolute"></span>'];
	s.push('<input id="breadcrumbsaddressbar" type="text" onkeydown="return Addons.BreadCrumbsAddressBar.KeyDown(this)" onfocus="Addons.BreadCrumbsAddressBar.Focus(this)" onblur="Addons.BreadCrumbsAddressBar.Blur(this)" onresize="Addons.BreadCrumbsAddressBar.Resize()" style="width: 100%; vertical-align: middle; color: window">');
	var o = document.getElementById(SetAddon(Addon_Id, Default, s.join("")));
	if (o.style.verticalAlign.length == 0) {
		o.style.verticalAlign = "middle";
	}
	Addons.BreadCrumbsAddressBar.Resize();
}
