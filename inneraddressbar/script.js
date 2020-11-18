var Addon_Id = "inneraddressbar";
var item = await GetAddonElement(Addon_Id);
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
		nSize: await api.GetSystemMetrics(SM_CYSMICON),

		KeyDown: function (ev, o, Id) {
			if (ev.keyCode == VK_RETURN || window.chrome && /^Enter/i.test(ev.key)) {
				(function (o, Id, str) {
					setTimeout(async function () {
						if (str == o.value) {
							var pt = await GetPosEx(o, 9);
							$.Input = o.value;
							if (await ExecMenu(await te.Ctrl(CTRL_WB), "Alias", pt, 2) != S_OK) {
								NavigateFV(await GetInnerFV(Id), o.value, null, true);
							}
						}
					}, 99);
				})(o, Id, o.value);
			}
			return true;
		},

		Resize: function (Id) {
			clearTimeout(this.tid[Id]);
			this.tid[Id] = setTimeout("Addons.InnerAddressBar.Arrange(null, " + Id + ");", 500);
		},

		Arrange: async function (FolderItem, Id) {
			this.tid[Id] = null;
			if (!FolderItem) {
				var TC = await te.Ctrl(CTRL_TC, Id);
				if (TC && await TC.Selected) {
					FolderItem = await TC.Selected.FolderItem;
				}
			}
			if (FolderItem) {
				var oAddr = document.getElementById("inneraddressbar_" + Id);
				if (!oAddr) {
					return;
				}
				var oPopup = document.getElementById("inneraddrselect_" + Id);
				oPopup.style.left = (oAddr.offsetWidth - oPopup.offsetWidth - 1) + "px";
				oPopup.style.lineHeight = Math.abs(oAddr.offsetHeight - 6) + "px";
				var oImg = document.getElementById("inneraddr_img_" + Id);
				oImg.style.top = Math.abs(oAddr.offsetHeight - oImg.offsetHeight) / 2 + "px";
			}
		},

		Focus: function (o, Id) {
			Activate(o, Id);
			o.select();
		},

		Go: async function (n, Id) {
			var FV = await GetInnerFV(Id);
			NavigateFV(FV, await this.GetPath(n, Id));
		},

		GetPath: async function (n, Id) {
			var FV = await GetInnerFV(Id);
			if (FV) {
				FolderItem = await FV.FolderItem;
			}
			while (n--) {
				FolderItem = await api.ILRemoveLastID(FolderItem);
			}
			return FolderItem;
		},

		Popup: async function (o, n, Id) {
			if (Addons.AddressBar.CanPopup(o, Id)) {
				Addons.InnerAddressBar.Item = o;
				var pt = GetPos(o, 9);
				MouseOver(o);
				$.FolderMenu.Invoke($.FolderMenu.Open(await this.GetPath(n, Id), pt.x, pt.y));
			}
		},

		Popup2: async function (o, Id) {
			var FV = await GetInnerFV(Id);
			if (FV) {
				var FolderItem = await FV.FolderItem;
				await $.FolderMenu.Clear();
				var hMenu = await api.CreatePopupMenu();
				while (!await api.ILIsEmpty(FolderItem)) {
					FolderItem = await api.ILRemoveLastID(FolderItem);
					await $.FolderMenu.AddMenuItem(hMenu, FolderItem);
				}
				Addons.InnerAddressBar.Item = o;
				Addons.InnerAddressBar.nLoopId = Id;
				ExitMenuLoop = function () {
					Addons.InnerAddressBar.nLoopId = 0;
				};
				MouseOver(o);
				var pt = GetPos(o, 9);
				var nVerb = await $.FolderMenu.TrackPopupMenu(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y);
				FolderItem = nVerb ? $.FolderMenu.Items[nVerb - 1] : null;
				$.FolderMenu.Clear();
				$.FolderMenu.Invoke(FolderItem, SBSP_SAMEBROWSER, FV);
			}
		},

		Popup3: async function (o, Id) {
			if (Addons.InnerAddressBar.CanPopup(o, Id)) {
				var FV = await GetInnerFV(Id);
				if (FV) {
					var pt = GetPos(o, 9);
					$.FolderMenu.LocationEx(pt.x + o.offsetWidth, pt.y);
				}
			}
		},

		CanPopup: function (o, Id) {
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

		Exec: async function () {
			var TC = await te.Ctrl(CTRL_TC);
			if (TC) {
				Addons.InnerAddressBar.ExecEx(await TC.Id);
			}
			return S_OK;
		},

		ExecEx: async function (Id) {
			if (isNaN(Id)) {
				var TC = await te.Ctrl(CTRL_TC);
				if (TC) {
					Id = await TC.Id;
				}
			}
			if (isFinite(Id)) {
				WebBrowser.Focus();
				document.getElementById("inneraddressbar_" + Id).focus();
			}
			return S_OK;
		}

	};

	AddEvent("ChangeView", async function (Ctrl) {
		if (await Ctrl.FolderItem && await Ctrl.Id == await Ctrl.Parent.Selected.Id) {
			var Id = await Ctrl.Parent.Id;
			var path = await api.GetDisplayNameOf(await Ctrl.FolderItem, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
			Addons.InnerAddressBar.path2[Id] = path
			var o = document.getElementById("inneraddressbar_" + Id);
			if (o) {
				o.value = path;
			}
			Addons.InnerAddressBar.Arrange(await Ctrl.FolderItem, Id);
			o = document.getElementById("inneraddr_img_" + Id);
			if (o) {
				o.src = await GetIconImage(Ctrl, await GetSysColor(COLOR_WINDOW));
			}
		}
	});

	AddEvent("PanelCreated", function (Ctrl, Id) {
		var nSize = Addons.InnerAddressBar.nSize;
		var s = (Addons.InnerAddressBar.path2[Id] || "").replace(/"/, "");
		s = ['<div style="position: relative; width; 100px; overflow: hidden"><input id="inneraddressbar_$" type="text" value="' + s + '" autocomplate="on" list="AddressList" onkeydown="return Addons.InnerAddressBar.KeyDown(event, this, $)" oninput="AdjustAutocomplete(this.value)" onfocus="Addons.InnerAddressBar.Focus(this, $)" onresize="Addons.InnerAddressBar.Resize($)" style="width: 100%; vertical-align: middle; padding-left: ', nSize + 4, 'px; padding-right: 16px;"><div id="inneraddrselect_$" class="button" style="position: absolute; top: 1px" onmouseover="MouseOver(this);" onmouseout="MouseOut()" onclick="Addons.InnerAddressBar.Popup3(this, $)">', BUTTONS.dropdown, '</span></div>'];
		s.push('<img id="inneraddr_img_$" src="icon:shell32.dll,3,16"');
		s.push(' onclick="return Addons.InnerAddressBar.ExecEx($);"');
		s.push(' oncontextmenu="Addons.InnerAddressBar.ExecEx($); return false;"');
		s.push(' style="position: absolute; left: 4px; top: 1.5pt; width: ', nSize, 'px; height: ', nSize, 'px; z-index: 3; border: 0px"></div>');
		SetAddon(null, "Inner1Center_" + Id, s.join("").replace(/\$/g, Id));
	});

	AddEvent("Arrange", async function (Ctrl, rc) {
		if (await Ctrl.Type == CTRL_TC) {
			if (await Ctrl.Selected) {
				Addons.InnerAddressBar.Resize(await Ctrl.Id);
			}
		}
	});

	//Menu
	if (item.getAttribute("MenuExec")) {
		Common.InnerAddressBar = await api.CreateObject("Object");
		Common.InnerAddressBar.strMenu = item.getAttribute("Menu");
		Common.InnerAddressBar.strName = item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name;
		Common.InnerAddressBar.nPos = GetNum(item.getAttribute("MenuPos"));
		$.importScript("addons\\" + Addon_Id + "\\sync.js");
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.InnerAddressBar.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.InnerAddressBar.Exec, "Func");
	}
	AddTypeEx("Add-ons", "Inner Address Bar", Addons.InnerAddressBar.Exec);
} else {
	SetTabContents(0, "General", '<label><input type="checkbox" id="!NoAutocomplete">Autocomplete</label>');
}
