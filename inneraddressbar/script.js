const Addon_Id = "inneraddressbar";
const item = await GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("Menu", "Edit");
	item.setAttribute("MenuPos", -1);

	item.setAttribute("KeyExec", 1);
	item.setAttribute("KeyOn", "All");
	item.setAttribute("Key", "Alt+D");
}

if (window.Addon == 1) {
	Addons.InnerAddressBar = {
		tid: [],
		Item: null,
		nLoopId: 0,
		nLevel: 0,
		tid2: false,
		path2: [],
		bClose: false,
		nSize: await api.GetSystemMetrics(SM_CYSMICON),

		KeyDown: function (ev, o, Id) {
			if (ev.keyCode ? ev.keyCode == VK_RETURN : /^Enter/i.test(ev.key)) {
				setTimeout(async function (o, Id, str) {
					if (str == o.value) {
						const pt = await GetPosEx(o, 9);
						$.Input = o.value;
						if (await ExecMenu(await te.Ctrl(CTRL_WB), "Alias", pt, 2) != S_OK) {
							NavigateFV(await GetInnerFV(Id), o.value, null, true);
						}
					}
				}, 99, o, Id, o.value);
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
				const TC = await te.Ctrl(CTRL_TC, Id);
				if (TC && await TC.Selected) {
					FolderItem = await TC.Selected.FolderItem;
				}
			}
			if (FolderItem) {
				const oAddr = document.getElementById("inneraddressbar_" + Id);
				if (!oAddr) {
					return;
				}
				const oPopup = document.getElementById("inneraddrselect_" + Id);
				oPopup.style.left = (oAddr.offsetWidth - oPopup.offsetWidth - 1) + "px";
				oPopup.style.lineHeight = Math.abs(oAddr.offsetHeight - 6) + "px";
				const oImg = document.getElementById("inneraddr_img_" + Id);
				oImg.style.top = Math.abs(oAddr.offsetHeight - oImg.offsetHeight) / 2 + "px";
			}
		},

		Focus: function (o, Id) {
			Activate(o, Id);
			setTimeout(async function () {
				if (o.selectionEnd == o.selectionStart && await api.GetKeyState(VK_LBUTTON) >= 0) {
					o.select()
				}
			}, ui_.DoubleClickTime);
		},

		Go: async function (n, Id) {
			NavigateFV(await GetInnerFV(Id), await this.GetPath(n, Id));
		},

		GetPath: async function (n, Id) {
			const FV = await GetInnerFV(Id);
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
				const pt = GetPos(o, 9);
				MouseOver(o);
				FolderMenu.Invoke(FolderMenu.Open(await this.GetPath(n, Id), pt.x, pt.y));
			}
		},

		Popup2: async function (o, Id) {
			const FV = await GetInnerFV(Id);
			if (FV) {
				let FolderItem = await FV.FolderItem;
				await FolderMenu.Clear();
				const hMenu = await api.CreatePopupMenu();
				while (!await api.ILIsEmpty(FolderItem)) {
					FolderItem = await api.ILRemoveLastID(FolderItem);
					await FolderMenu.AddMenuItem(hMenu, FolderItem);
				}
				Addons.InnerAddressBar.Item = o;
				Addons.InnerAddressBar.nLoopId = Id;
				ExitMenuLoop = function () {
					Addons.InnerAddressBar.nLoopId = 0;
				};
				MouseOver(o);
				const pt = GetPos(o, 9);
				const nVerb = await FolderMenu.TrackPopupMenu(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y);
				FolderItem = nVerb ? FolderMenu.Items[nVerb - 1] : null;
				FolderMenu.Clear();
				FolderMenu.Invoke(FolderItem, SBSP_SAMEBROWSER, FV);
			}
		},

		Popup3: async function (o, Id) {
			if (Addons.InnerAddressBar.CanPopup(o, Id)) {
				const FV = await GetInnerFV(Id);
				if (FV) {
					const pt = GetPos(o, 9);
					FolderMenu.LocationEx(pt.x + o.offsetWidth, pt.y);
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
			const TC = await te.Ctrl(CTRL_TC);
			if (TC) {
				Addons.InnerAddressBar.ExecEx(await TC.Id);
			}
			return S_OK;
		},

		ExecEx: async function (Id) {
			if (isNaN(Id)) {
				const TC = await te.Ctrl(CTRL_TC);
				if (TC) {
					Id = await TC.Id;
				}
			}
			if (isFinite(Id)) {
				WebBrowser.Focus();
				document.getElementById("inneraddressbar_" + Id).focus();
			}
			return S_OK;
		},

		ChangeView: async function(Ctrl) {
			const pid = await Ctrl.FolderItem;
			if (pid) {
				const Id = await Ctrl.Parent.Id;
				const path = await pid.Path;
				Addons.InnerAddressBar.path2[Id] = path
				const o = document.getElementById("inneraddressbar_" + Id);
				if (o) {
					o.value = path;
					Addons.InnerAddressBar.Arrange(await Ctrl.FolderItem, Id);
					document.getElementById("inneraddr_img_" + Id).src = await GetIconImage(Ctrl, await GetSysColor(COLOR_WINDOW));
				}
			}
		}
	};

	AddEvent("ChangeView2", Addons.InnerAddressBar.ChangeView);

	AddEvent("PanelCreated", function (Ctrl, Id) {
		const nSize = Addons.InnerAddressBar.nSize;
		const s = ['<div style="position: relative; width; 100px; overflow: hidden"><input id="inneraddressbar_', Id, '" type="text" value="', (Addons.InnerAddressBar.path2[Id] || "").replace(/"/, ""), '" autocomplate="on" list="AddressList" onkeydown="return Addons.InnerAddressBar.KeyDown(event, this, ', Id, ')" oninput="AdjustAutocomplete(this.value)" onfocus="Addons.InnerAddressBar.Focus(this, ', Id, ')" onresize="Addons.InnerAddressBar.Resize(', Id, ')" style="width: 100%; vertical-align: middle; padding-left: ', nSize + 4, 'px; padding-right: 16px;"><div id="inneraddrselect_', Id, '" class="button" style="position: absolute; top: 1px" onmouseover="MouseOver(this);" onmouseout="MouseOut()" onclick="Addons.InnerAddressBar.Popup3(this, ', Id, ')">', BUTTONS.dropdown, '</span></div>'];
		s.push('<img id="inneraddr_img_', Id, '"');
		s.push(' onclick="return Addons.InnerAddressBar.ExecEx(', Id, ');"');
		s.push(' oncontextmenu="Addons.InnerAddressBar.ExecEx(', Id, '); return false;"');
		s.push(' style="position: absolute; left: 4px; top: 1.5pt; width: ', nSize, 'px; height: ', nSize, 'px; z-index: 3; border: 0px"></div>');
		SetAddon(null, "Inner1Center_" + Id, s.join(""));
		(async function () {
			Addons.InnerAddressBar.ChangeView(await Ctrl.Selected);
		})();
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
		SetMenuExec("InnerAddressBar", item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name, item.getAttribute("Menu"), item.getAttribute("MenuPos"));
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.InnerAddressBar.Exec, "Async");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.InnerAddressBar.Exec, "Async");
	}
	AddTypeEx("Add-ons", "Inner Address Bar", Addons.InnerAddressBar.Exec);
} else {
	SetTabContents(0, "General", '<label><input type="checkbox" id="!NoAutocomplete">Autocomplete</label>');
}
