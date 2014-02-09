if (window.Addon == 1) {
	Addons.InnerBreadcrumbsAddressBar =
	{
		tid: [],
		Item: null,
		nLoopId: 0,
		nLevel: 0,
		tid2: [],
		path2: [],
		bClose: false,

		KeyDown: function (o, Id)
		{
			if (event.keyCode == VK_RETURN) {
				var p = GetPos(o);
				var pt = api.Memory("POINT");
				pt.x = screenLeft + p.x;
				pt.y = screenTop + p.y + o.offsetHeight;
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
				var FV = GetInnerFV(CTRL_FV);
				if (FV) {
					FolderItem = FV.FolderItem;
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
				var width = oAddr.offsetWidth - 32;
				var height = oAddr.offsetHeight - 6;
				var n = 0;
				do {
					if (n || api.GetAttributesOf(FolderItem, SFGAO_HASSUBFOLDER)) {
						s.unshift('<span id="breadcrumbsaddressbar_' + Id + "_"  + n + '" class="button" style="font-family: webdings; line-height: ' + height + 'px; vertical-align: middle" onclick="Addons.InnerBreadcrumbsAddressBar.Popup(this,' + n + ', ' + Id + ')" onmouseover="MouseOver(this)" onmouseout="MouseOut()">4</span>');
					}
					s.unshift('<span class="button" style="line-height: ' + height + 'px" onclick="Addons.InnerBreadcrumbsAddressBar.Go(' + n + ', ' + Id + ')" onmouseover="MouseOver(this)" onmouseout="MouseOut()">' + api.GetDisplayNameOf(FolderItem, SHGDN_INFOLDER) + '</span>');
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
						o.insertAdjacentHTML("AfterBegin", '<span id="breadcrumbsaddressbar_' + Id + '_' + n + '" class="button" style="font-family: webdings; line-height: ' + height + 'px" onclick="Addons.InnerBreadcrumbsAddressBar.Popup(this, ' + n + ', ' + Id + ')" onmouseover="MouseOver(this)" onmouseout="MouseOut()">4</span>');
					}
				}
				else {
					o.insertAdjacentHTML("AfterBegin", '<span id="breadcrumbsaddressbar_' + Id + '_' + n + '" class="button" style="line-height: ' + height + 'px" onclick="Addons.InnerBreadcrumbsAddressBar.Popup2(this, '+ Id +')" onmouseover="MouseOver(this)" onmouseout="MouseOut()">&laquo;</span>');
				}
				this.nLevel = n;
				(function (o) { setTimeout(function () {
					var pt = GetPos(oAddr, false, false, true);
					o.style.left = (pt.x + 1) + "px";
					o.style.top = (pt.y + (oAddr.offsetHeight - o.offsetHeight) / 2) + "px";
				}, 100);}) (o);
			}
		},

		Focus: function (o, Id)
		{
			o.select();
			o.style.color = "windowtext";
			document.getElementById("breadcrumbsbuttons_" + Id).style.display = "none";
		},

		Blur: function (o, Id)
		{
			o.style.color = "window";
			document.getElementById("breadcrumbsbuttons_" + Id).style.display = "inline";
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
			if (!Addons.InnerBreadcrumbsAddressBar.bClose) {
				Addons.InnerBreadcrumbsAddressBar.Item = o;
				var pt = GetPos(o, true);
				Addons.InnerBreadcrumbsAddressBar.nLoopId = Id;
				AddEvent("ExitMenuLoop", function () {
					Addons.InnerBreadcrumbsAddressBar.nLoopId = 0;
					Addons.InnerBreadcrumbsAddressBar.bClose = true;
					clearTimeout(Addons.InnerBreadcrumbsAddressBar.tid2);
					Addons.InnerBreadcrumbsAddressBar.tid2 = setTimeout("Addons.InnerBreadcrumbsAddressBar.bClose = false;", 500);

				});
				MouseOver(o);
				var FV = GetInnerFV(Id);
				FV.Focus();
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
				Addons.InnerBreadcrumbsAddressBar.Item = o;
				Addons.InnerBreadcrumbsAddressBar.nLoopId = Id;
				ExitMenuLoop = function () {
					Addons.InnerBreadcrumbsAddressBar.nLoopId = 0;
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
				var FV = GetInnerFV(Id);
				FV.Focus();
				FolderMenu.Invoke(FolderItem);
			}
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
							wsh.SendKeys("{Esc}");
							(function (o, Id) { setTimeout(function () {
								Addons.InnerBreadcrumbsAddressBar.bClose = false;
								o.click();
							}, 100);}) (o);
						}
					}
				}
			}
		}
	});


	AddEvent("PanelCreated", function (Ctrl)
	{
		var s = (Addons.InnerBreadcrumbsAddressBar.path2[Ctrl.Id] || "").replace(/"/, "");
		s = '<span id="breadcrumbsbuttons_$" style="margin 2px; background-color: window; white-space: nowrap; position: absolute"></span><input id="breadcrumbsaddressbar_$" type="text" value="' + s + '" onkeydown="return Addons.InnerBreadcrumbsAddressBar.KeyDown(this, $)" onfocus="Addons.InnerBreadcrumbsAddressBar.Focus(this, $)" onblur="Addons.InnerBreadcrumbsAddressBar.Blur(this, $)" onresize="Addons.InnerBreadcrumbsAddressBar.Resize($)" style="width: 100%; vertical-align: middle; color: window">';
		SetAddon(null, "Inner1Center_" + Ctrl.Id, s.replace(/\$/g, Ctrl.Id));
	});
}
