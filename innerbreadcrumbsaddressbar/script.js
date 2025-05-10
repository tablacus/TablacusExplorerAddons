const Addon_Id = "innerbreadcrumbsaddressbar";
const item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("Menu", "Edit");
	item.setAttribute("MenuPos", -1);

	item.setAttribute("KeyExec", 1);
	item.setAttribute("KeyOn", "All");
	item.setAttribute("Key", "Alt+D");
}

if (window.Addon == 1) {
	Common.InnerBreadcrumbsAddressBar = await api.CreateObject("Object");
	Addons.InnerBreadcrumbsAddressBar = {
		tid: [],
		Item: null,
		tid2: false,
		path2: [],
		bClose: false,
		nLevel: {},
		SplitPathItems: {},

		KeyDown: function (ev, o, Id) {
			if (ev.keyCode ? ev.keyCode == VK_RETURN : /^Enter/i.test(ev.key)) {
				setTimeout(async function (o, Id, str) {
					if (str == o.value) {
						const pt = await GetPosEx(o, 9);
						$.Input = o.value;
						if (ExecMenu(await te.Ctrl(CTRL_WB), "Alias", pt, 2) != S_OK) {
							NavigateFV(await GetInnerFV(Id), o.value, await GetNavigateFlags(), true);
						}
					}
				}, 99, o, Id, o.value);
			}
			return true;
		},

		Resize: function (Id) {
			clearTimeout(this.tid[Id]);
			this.tid[Id] = setTimeout(async function (Id) {
				const TC = await te.Ctrl(CTRL_TC, Id);
				if (TC && await TC.Selected) {
					Addons.InnerBreadcrumbsAddressBar.Arrange(await TC.Selected.FolderItem, Id);
				}
			}, 500, Id);
		},

		Arrange: async function (FolderItem, Id) {
			delete this.tid[Id];
			if (FolderItem) {
				let Items = Addons.InnerBreadcrumbsAddressBar.SplitPathItems[Id];
				if (!Items) {
					Items = JSON.parse(await Sync.InnerBreadcrumbsAddressBar.SplitPath(FolderItem));
					if (Items) {
						Addons.InnerBreadcrumbsAddressBar.SplitPathItems[Id] = Items;
					} else {
						return;
					}
				}
				const arHTML = [];
				const o = document.getElementById("breadcrumbsbuttons_" + Id);
				const oAddr = document.getElementById("breadcrumbsaddressbar_" + Id);
				if (!oAddr) {
					return;
				}
				const oPopup = document.getElementById("breadcrumbsselect_" + Id);
				const oImg = document.getElementById("breadcrumbsaddr_img_" + Id);
				const width = oAddr.offsetWidth - oImg.offsetWidth + oPopup.offsetWidth - 2;
				const height = oAddr.offsetHeight - 6;
				o.style.height = (oAddr.offsetHeight - 2) + "px";
				o.style.width = "auto";
				let bEmpty = true, n;
				o.innerHTML = "";
				for (n = 0; n < Items.length; ++n) {
					if (Items[n].next) {
						arHTML.unshift('<span id="breadcrumbsaddressbar_' + Id + "_" + n + '" class="button" style="line-height: ' + height + 'px; vertical-align: middle" onclick="Addons.InnerBreadcrumbsAddressBar.Popup(this,' + n + ', ' + Id + ')" onmouseover="MouseOver(this)" onmouseout="MouseOut()" oncontextmenu="return false;">' + BUTTONS.next + '</span>');
						o.insertAdjacentHTML("afterbegin", arHTML[0]);
					}
					arHTML.unshift('<span id="breadcrumbsaddressbar_' + Id + "_" + n + '_" class="button" style="line-height: ' + height + 'px" onmouseover="MouseOver(this)" onmouseout="MouseOut()" oncontextmenu="return false;" ondragstart="Addons.InnerBreadcrumbsAddressBar.Drag(event,' + Id + ',' + n +'); return false;" draggable="true">' + EncodeSC(Items[n].name) + '</span>');
					const nBefore = o.offsetWidth;
					o.insertAdjacentHTML("afterbegin", arHTML[0]);
					if (o.offsetWidth != nBefore && o.offsetWidth > width && n > 0) {
						arHTML.splice(0, 2);
						o.innerHTML = arHTML.join("");
						bEmpty = false;
						break;
					}
				}
				o.style.width = (oAddr.offsetWidth - 2) + "px";
				if (bEmpty) {
					if (!Items[0].bRoot) {
						o.insertAdjacentHTML("AfterBegin", '<span id="breadcrumbsaddressbar_' + Id + '_' + n + '" class="button" style="line-height: ' + height + 'px" onclick="Addons.InnerBreadcrumbsAddressBar.Popup(this, ' + n + ', ' + Id + ')" onmouseover="MouseOver(this)" onmouseout="MouseOut()">' + BUTTONS.next + '</span>');
					}
				} else {
					o.insertAdjacentHTML("AfterBegin", '<span id="breadcrumbsaddressbar_' + Id + '_' + n + '" class="button" style="line-height: ' + height + 'px" onclick="Addons.InnerBreadcrumbsAddressBar.Popup2(this, ' + Id + ')" onmouseover="MouseOver(this)" onmouseout="MouseOut()">' + BUTTONS.parent + '</span>');
				}
				Addons.InnerBreadcrumbsAddressBar.nLevel[Id] = n;
				oPopup.style.left = (oAddr.offsetWidth - oPopup.offsetWidth - 1) + "px";
				oPopup.style.lineHeight = Math.abs(oAddr.offsetHeight - 6) + "px";
				oImg.style.top = Math.abs(oAddr.offsetHeight - oImg.offsetHeight) / 2 + "px";
			}
		},

		Focus: function (Id) {
			if (Addons.InnerBreadcrumbsAddressBar.tm && new Date().getTime() - Addons.InnerBreadcrumbsAddressBar.tm < 999) {
				delete Addons.InnerBreadcrumbsAddressBar.tm;
				return;
			}
			const o = document.getElementById("breadcrumbsaddressbar_" + Id);
			if (Addons.InnerBreadcrumbsAddressBar.bClose) {
				o.blur();
			} else {
				Activate(o, Id);
				document.getElementById("breadcrumbsbuttons_" + Id).style.display = "none";
				if (o.selectionEnd == o.selectionStart) {
					o.select()
				}
			}
		},

		Blur: function (Id) {
			const o = document.getElementById("breadcrumbsbuttons_" + Id);
			if (o) {
				o.style.display = "inline-block";
				ClearAutocomplete();
			}
		},

		Popup1: async function (ev) {
			const el = document.elementFromPoint(ev.clientX, ev.clientY);
			const res = el && /^breadcrumbsaddressbar_(\d+)_(\d+)_$/.exec(el.id);
			if (res) {
				Addons.InnerBreadcrumbsAddressBar.tm = new Date().getTime();
				const pt = GetPos(el, 9);
				MouseOver(el);
				const hMenu = await api.CreatePopupMenu();
				await api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, 1, await api.LoadString(hShell32, 33561));
				await api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, 2, await GetText("Copy full path"));
				await api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_SEPARATOR, 0, null);
				await api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, 3, await GetText("Open in new &tab"));
				await api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, 4, await GetText("Open in background"));
				await api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_SEPARATOR, 0, null);
				await api.InsertMenu(hMenu, MAXINT, MF_BYPOSITION | MF_STRING, 5, await GetText("&Edit"));
				Addons.InnerBreadcrumbsAddressBar.tm = new Date().getTime();
				const nVerb = await api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, ui_.hwnd, null, null);
				api.DestroyMenu(hMenu);
				switch (nVerb) {
					case 1:
						const Items = await api.CreateObject("FolderItems");
						await Items.AddItem(await Sync.InnerBreadcrumbsAddressBar.GetPath(res[2], res[1]));
						api.OleSetClipboard(Items);
						break;
					case 2:
						clipboardData.setData("text", await (await Sync.InnerBreadcrumbsAddressBar.GetPath(res[2], res[1])).Path);
						break;
					case 3:
						NavigateFV(await GetInnerFV(res[1]), await Sync.InnerBreadcrumbsAddressBar.GetPath(res[2], res[1]), SBSP_NEWBROWSER);
						break;
					case 4:
						NavigateFV(await GetInnerFV(res[1]), await Sync.InnerBreadcrumbsAddressBar.GetPath(res[2], res[1]), SBSP_NEWBROWSER | SBSP_ACTIVATE_NOFOCUS);
						break;
					case 5:
						Addons.InnerBreadcrumbsAddressBar.Exec(res[1]);
						break;
				}
			}
		},

		Drag: async function (ev, Id, n) {
			const DataObj = await api.CreateObject("FolderItems");
			DataObj.AddItem(await Sync.InnerBreadcrumbsAddressBar.GetPath(n, Id));
			DataObj.dwEffect = DROPEFFECT_LINK;
			DoDragDrop(DataObj, DROPEFFECT_LINK | DROPEFFECT_COPY | DROPEFFECT_MOVE);

		},

		Down1: function (ev, Id) {
			Addons.InnerBreadcrumbsAddressBar.ev = ev;
			const el = document.elementFromPoint(ev.clientX, ev.clientY);
			if (el && /^breadcrumbsaddressbar_(\d+)_(\d+)_$/.test(el.id)) {
				Addons.InnerBreadcrumbsAddressBar.tm = new Date().getTime();
			}
		},

		Up1: function (ev) {
			const ev1 = Addons.InnerBreadcrumbsAddressBar.ev || {};
			const buttons = ev1.buttons != null ? ev1.buttons : ev1.button;
			const el = document.elementFromPoint(ev.clientX, ev.clientY);
			let res = el && /^breadcrumbsaddressbar_(\d+)_(\d+)_$/.exec(el.id);
			if (Math.abs(ev.screenX - ev1.screenX) < 4 && Math.abs(ev.screenY - ev1.screenY) < 4) {
				if (res) {
					if (buttons & 5) {
						Promise.all([GetInnerFV(res[1]), Sync.InnerBreadcrumbsAddressBar.GetPath(res[2], res[1]), GetNavigateFlags()]).then(function (r) {
							NavigateFV(r[0], r[1], r[2] | (buttons & 4 ? SBSP_NEWBROWSER : SBSP_SAMEBROWSER));
						});
						return;
					}
				} else {
					res = el && /^breadcrumbsbuttons_(\d+)$/.exec(el.id);
					if (res) {
						Addons.InnerBreadcrumbsAddressBar.Exec(res[1]);
					}
				}
			}
			setTimeout(function () {
				delete Addons.InnerBreadcrumbsAddressBar.ev;
			}, 99);
		},

		ContextMenu: function (o) {
			if (!window.chrome && o.selectionEnd == o.selectionStart) {
				o.select();
			}
		},

		Popup: function (o, n, Id) {
			delete Addons.InnerBreadcrumbsAddressBar.tidPopup;
			if (Addons.InnerBreadcrumbsAddressBar.CanPopup(o, Id)) {
				setTimeout(async function (o, n, Id) {
					Common.InnerBreadcrumbsAddressBar.Item = await GetRect(o);
					await Addons.InnerBreadcrumbsAddressBar.SavePos(Id);
					const pt = GetPos(o, 9);
					MouseOver(o);
					FolderMenu.Invoke(await FolderMenu.Open(await Sync.InnerBreadcrumbsAddressBar.GetPath(n, Id), pt.x, pt.y, null, 1));
				}, 9, o, n, Id);
			}
		},

		Popup2: async function (o, Id) {
			const FV = await GetInnerFV(Id);
			if (FV) {
				let FolderItem = await FV.FolderItem;
				FolderMenu.Clear();
				const hMenu = api.CreatePopupMenu();
				for (let n = 99; !await api.ILIsEmpty(FolderItem) && --n;) {
					FolderItem = await api.ILGetParent(FolderItem);
					await FolderMenu.AddMenuItem(hMenu, FolderItem);
				}
				Common.InnerBreadcrumbsAddressBar.Item = await GetRect(o);
				Common.InnerBreadcrumbsAddressBar.nLoopId = Id;
				ExitMenuLoop = function () {
					Common.InnerBreadcrumbsAddressBar.nLoopId = 0;
				};
				MouseOver(o);
				await Addons.InnerBreadcrumbsAddressBar.SavePos(Id);
				const pt = GetPos(o, 9);
				const nVerb = await FolderMenu.TrackPopupMenu(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y);
				FolderItem = nVerb ? await FolderMenu.Items[nVerb - 1] : null;
				FolderMenu.Clear();
				FolderMenu.Invoke(FolderItem, SBSP_SAMEBROWSER, FV);
			}
		},

		Popup3: async function (o, Id) {
			if (Addons.InnerBreadcrumbsAddressBar.CanPopup(o, Id)) {
				const FV = await GetInnerFV(Id);
				if (FV) {
					const pt = GetPos(o, 9);
					FolderMenu.LocationEx(pt.x + o.offsetWidth, pt.y);
				}
			}
		},

		CanPopup: function (o, Id) {
			if (!Addons.InnerBreadcrumbsAddressBar.bClose) {
				Common.InnerBreadcrumbsAddressBar.nLoopId = Id;
				Addons.InnerBreadcrumbsAddressBar.bLoop = true;
				Addons.InnerBreadcrumbsAddressBar.bClose = true;
				AddEvent("ExitMenuLoop", function () {
					Common.InnerBreadcrumbsAddressBar.nLoopId = 0;
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

		Exec: async function (Id) {
			if (isNaN(Id)) {
				const TC = await te.Ctrl(CTRL_TC);
				if (TC) {
					Id = await TC.Id;
				}
			}
			if (isFinite(Id)) {
				document.getElementById("breadcrumbsaddressbar_" + Id).focus();
			}
			WebBrowser.Focus();
			return S_OK;
		},

		SavePos: async function (Id) {
			const rc = await api.CreateObject("Array");
			Common.InnerBreadcrumbsAddressBar.rcItem = rc;
			for (let i = Addons.InnerBreadcrumbsAddressBar.nLevel[Id]; i >= 0; --i) {
				const el = document.getElementById("breadcrumbsaddressbar_" + Id + "_" + i);
				if (el) {
					rc[i] = await GetRect(el);
				}
			}
		},

		ChangeMenu: function (Id, i) {
			setTimeout(function (Id, i) {
				Addons.InnerBreadcrumbsAddressBar.bClose = false;
				const el = document.getElementById("breadcrumbsaddressbar_" + Id + "_" + i);
				if (el) {
					el.click();
				}
			}, 99, Id, i);
		},

		SetRects: async function () {
			const rcItems = await api.CreateObject("Object");
			Common.InnerBreadcrumbsAddressBar.rcItems = rcItems;
			const cTC = await te.Ctrls(CTRL_TC, false, window.chrome);
			for (let j = cTC.length; --j >= 0;) {
				const TC = cTC[j];
				const Id = await TC.Id;
				const rc = await api.CreateObject("Array");
				for (let i = Addons.InnerBreadcrumbsAddressBar.nLevel[Id]; --i >= 0;) {
					const el = document.getElementById("breadcrumbsaddressbar_" + Id + "_" + i + "_");
					if (el) {
						rc[i] = await GetRect(el);
					}
				}
				rcItems[Id] = rc;
			}
		}
	};

	AddEvent("ChangeView2", async function (Ctrl) {
		Promise.all([Ctrl.Parent.Id, Ctrl.FolderItem, api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING)]).then(async function (r) {
			Addons.InnerBreadcrumbsAddressBar.SplitPathItems[r[0]] = JSON.parse(await Sync.InnerBreadcrumbsAddressBar.SplitPath(r[1]));
			Addons.InnerBreadcrumbsAddressBar.Blur(r[0]);
			Addons.InnerBreadcrumbsAddressBar.path2[r[0]] = r[2];
			await Addons.InnerBreadcrumbsAddressBar.Arrange(r[1], r[0]);
			(document.getElementById("breadcrumbsaddressbar_" + r[0]) || {}).value = r[2];
			(document.getElementById("breadcrumbsaddr_img_" + r[0]) || {}).src = await GetIconImage(r[1], CLR_DEFAULT | COLOR_WINDOW);
		});
	});

	AddEvent("PanelCreated", function (Ctrl, Id) {
		const z = screen.deviceYDPI / 96;
		let s = (Addons.InnerBreadcrumbsAddressBar.path2[Id] || "").replace(/"/, "");
		s = ['<div style="position: relative; overflow: hidden"><div id="breadcrumbsbuttons_', Id, '" class="breadcrumb" style="position: absolute; top: 1px; left: 1px; padding-left: ', 16 * z + 4, 'px" oncontextmenu="Addons.InnerBreadcrumbsAddressBar.Popup1(event); return false" onmousedown="return Addons.InnerBreadcrumbsAddressBar.Down1(event,', Id, ')" onmouseup="Addons.InnerBreadcrumbsAddressBar.Up1(event); return false"></div><input id="breadcrumbsaddressbar_', Id, '" type="text" value="', s, '" autocomplate="on" list="AddressList" onkeydown="return Addons.InnerBreadcrumbsAddressBar.KeyDown(event, this,', Id, ')" oninput="AdjustAutocomplete(this.value)" oncontextmenu="Addons.InnerBreadcrumbsAddressBar.ContextMenu(this)" onfocus="Addons.InnerBreadcrumbsAddressBar.Focus(', Id, ')" onblur="Addons.InnerBreadcrumbsAddressBar.Blur(', Id, ')" onresize="Addons.InnerBreadcrumbsAddressBar.Resize(', Id, ')" style="width: 100%; vertical-align: middle; padding-left: ', 16 * z + 4, 'px; padding-right: 16px;"><div class="breadcrumb"><div id="breadcrumbsselect_', Id, '" class="button" style="position: absolute; top: 1px" onmouseover="MouseOver(this);" onmouseout="MouseOut()" onclick="Addons.InnerBreadcrumbsAddressBar.Popup3(this, ', Id, ')">', BUTTONS.dropdown, '</div></div>'];
		s.push('<img id="breadcrumbsaddr_img_', Id, '"');
		s.push(' onclick="return Addons.InnerBreadcrumbsAddressBar.Exec(', Id, ');"');
//		s.push(' oncontextmenu="Addons.InnerBreadcrumbsAddressBar.Exec(', Id, '); return false;"');
		s.push(' ondragstart="Addons.InnerBreadcrumbsAddressBar.Drag(event,', Id, ',0); return false;" draggable="true"');
		s.push(' style="position: absolute; left: 4px; top:', 2 * z, 'px; width: ', 16 * z, 'px; height: ', 16 * z, 'px; z-index: 3; border: 0px"></div>');
		return SetAddon(null, "Inner1Center_" + Id, s.join(""));
	});

	AddEvent("Arrange", function (Ctrl, rc) {
		Promise.all([Ctrl.Type, Ctrl.Selected, Ctrl.Id]).then(function (r) {
			if (r[0] == CTRL_TC && r[1]) {
				Addons.InnerBreadcrumbsAddressBar.Resize(r[2]);
			}
		});
	});

	//Menu
	const strName = item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name;
	if (item.getAttribute("MenuExec")) {
		SetMenuExec("InnerBreadcrumbsAddressBar", strName, item.getAttribute("Menu"), item.getAttribute("MenuPos"));
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.InnerBreadcrumbsAddressBar.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.InnerBreadcrumbsAddressBar.Exec, "Func");
	}
	AddTypeEx("Add-ons", "Inner Breadcrumbs Address Bar", Addons.InnerBreadcrumbsAddressBar.Exec);

	$.importScript("addons\\" + Addon_Id + "\\sync.js");
}
