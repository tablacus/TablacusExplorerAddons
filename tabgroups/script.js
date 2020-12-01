const Addon_Id = "tabgroups";
const Default = "ToolBar5Center";

const item = await GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.Tabgroups = {
		Name: null,
		WheelButton: 0,
		tid: null,
		bTab: !GetNum(item.getAttribute("Mode")),
		Focused: {},
		strNewTab: await GetText("New Tab"),

		Init: async function () {
			SetAddon(Addon_Id, Default, ['<ul class="', Addons.Tabgroups.bTab ? "tab0" : "menu0", '" id="tabgroups"><li> </li></ul>']);
			if (!await te.Data.Tabgroups) {
				te.Data.Tabgroups = await api.CreateObject("Object");
				te.Data.Tabgroups.Data = await api.CreateObject("Array");
				te.Data.Tabgroups.Index = 1;
			}
			Addons.Tabgroups.Data = await te.Data.Tabgroups.Data;

			setTimeout(async function () {
				if (!await te.Data.Tabgroups.Click) {
					Sync.Tabgroups.LoadWindow(await OpenXml("window.xml", true, false));
				}
			}, 999);
		},

		Arrange: async function (bForce) {
			await Addons.Tabgroups.Fix();
			let s = [];
			let o = document.getElementById("tabgroups");
			let tabs = o.getElementsByTagName("li");
			let nLen = await GetLength(await te.Data.Tabgroups.Data);
			if (bForce || tabs.length != nLen + 1) {
				for (let i = 0; i < nLen; ++i) {
					Addons.Tabgroups.Tab(s, i + 1);
				}
				s.push('<li class=', Addons.Tabgroups.bTab ? ' "tab3"' : "menu", ' title="', Addons.Tabgroups.strNewTab, '" onclick="Sync.Tabgroups.Add()">+</li>');
				o.innerHTML = s.join("");
			}
			for (let i = 0; i < nLen; ++i) {
				Addons.Tabgroups.Style(tabs, i + 1);
			}
			Addons.Tabgroups.Change();
		},

		Tab: function (s, i) {
			s.push('<li id="tabgroups', i, '"');
			s.push(' onmousedown="return Addons.Tabgroups.Down(event, this)" onmouseup="return Addons.Tabgroups.Up(this)"');
			s.push(' oncontextmenu="Addons.Tabgroups.Popup(event, this); return false;" onmousewheel="Addons.Tabgroups.Wheel(event)" ondblclick="return Addons.Tabgroups.Edit(this)"');
			if (ui_.IEVer > 9) {
				s.push(' draggable="true" ondragstart="return Addons.Tabgroups.Start5(event, this)" ondragend="Addons.Tabgroups.End5()"');
			} else {
				s.push(' draggable="false" onmousemove="Addons.Tabgroups.Move(event, this)"');
			}
			s.push('></li>');
		},

		Style: async function (tabs, i) {
			let o = tabs[i - 1];
			if (!o) {
				return;
			}
			let data = await te.Data.Tabgroups.Data[i - 1];
			let s = [await data.Name];
			if (await data.Lock) {
				s.unshift(Addons.Tabgroups.ImgLock);
			}
			o.innerHTML = s.join("");
			let style = o.style;
			let cl = await data.Color;
			if (cl) {
				if (ui_.IEVer >= 10) {
					style.background = "none";
				} else {
					style.filter = "none";
				}
				style.backgroundColor = cl;
				cl = Number(cl.replace(/^#/, "0x"));
				cl = (cl & 0xff0000) * .0045623779296875 + (cl & 0xff00) * 2.29296875 + (cl & 0xff) * 114;
				style.color = cl > 127000 ? "black" : "white";
			} else {
				if (ui_.IEVer >= 10) {
					style.background = "";
				} else if (style.filter) {
					style.filter = "";
				}
				style.color = "";
				style.backgroundColor = "";
			}
			if (i == await te.Data.Tabgroups.Index) {
				o.className = Addons.Tabgroups.bTab ? 'activetab' : 'activemenu';
				style.zIndex = tabs.length;
			} else {
				if (Addons.Tabgroups.bTab) {
					o.className = i < await te.Data.Tabgroups.Index ? 'tab' : 'tab2';
				} else {
					o.className = 'menu';
				}
				style.zIndex = tabs.length - i;
			}
			Common.Tabgroups.rcItem[i - 1] = await GetRect(o);
		},

		Change: async function (n) {
			let oShow = {};
			if (n > 0) {
				te.Data.Tabgroups.Click = n;
			}
			let nFocusedId = await Addons.Tabgroups.Focused[await te.Data.Tabgroups.Click];
			await this.Fix();
			if (await te.Data.Tabgroups.Click != await te.Data.Tabgroups.Index && await te.Data.Tabgroups.Click < await GetLength(await te.Data.Tabgroups.Data) + 1) {
				te.Data.Tabgroups.Index = await te.Data.Tabgroups.Click;
				this.Arrange();
				te.LockUpdate();
				let bDisp = false;
				let freeTC = [];
				let preTC = [];
				let cTC = await te.Ctrls(CTRL_TC);
				let nLen = await cTC.Count;
				for (let i = 0; i < nLen; i++) {
					let TC = await cTC[i];
					if (await TC.Visible) {
						preTC.push(TC);
					} else if (!await TC.Data.Group) {
						freeTC.push(TC);
					}
					let b = await TC.Data.Group == await te.Data.Tabgroups.Index;
					if (b) {
						let s = [await TC.Left, await TC.Top, await TC.Width, await TC.Height].join(",");
						if (oShow[s]) {
							b = false;
							api.ObjDelete(TC.Data, "Group");
						} else {
							oShow[s] = true;
						}
					}
					TC.Visible = b;
					if (await TC.Id === nFocusedId) {
						TC.Selected.Focus();
					}
					bDisp |= b;
				}
				if (!bDisp) {
					if (preTC.length) {
						for (let i = 0; i < preTC.length; i++) {
							let PT = preTC[i];
							let TC = await this.CreateTC(freeTC, await PT.Left, await PT.Top, await PT.Width, await PT.Height, await PT.Style, await PT.Align, await PT.TabWidth, await PT.TabHeight);
							if (await TC.Count == 0) {
								let FV = await PT.Selected;
								if (FV) {
									let TV = await FV.TreeView;
									TC.Selected.Navigate2(await FV.FolderItem, SBSP_NEWBROWSER, await FV.Type, await FV.CurrentViewMode, await FV.FolderFlags, await FV.Options, await FV.ViewFlags, await FV.IconSize, await TV.Align, await TV.Width, await TV.Style, await TV.EnumFlags, await TV.RootStyle, await TV.Root);
								} else {
									TC.Selected.Navigate2(HOME_PATH, SBSP_NEWBROWSER, await te.Data.View_Type, await te.Data.View_ViewMode, await te.Data.View_fFlags, await te.Data.View_Options, await te.Data.View_ViewFlags, await te.Data.View_IconSize, await te.Data.Tree_Align, await te.Data.Tree_Width, await te.Data.Tree_Style, await te.Data.Tree_EnumFlags, await te.Data.Tree_RootStyle, await te.Data.Tree_Root);
								}
								TC.Visible = true;
							}
						}
					} else {
						let TC = await this.CreateTC(freeTC, 0, 0, "100%", "100%", await te.Data.Tab_Style, await te.Data.Tab_Align, await te.Data.Tab_TabWidth, await te.Data.Tab_TabHeight);
						TC.Data.Group = await te.Data.Tabgroups.Index;
						TC.Selected.Navigate2(await $.HOME_PATH, SBSP_NEWBROWSER, await te.Data.View_Type, await te.Data.View_ViewMode, await te.Data.View_fFlags, await te.Data.View_Options, await te.Data.View_ViewFlags, await te.Data.View_IconSize, await te.Data.Tree_Align, await te.Data.Tree_Width, await te.Data.Tree_Style, await te.Data.Tree_EnumFlags, await te.Data.Tree_RootStyle, await te.Data.Tree_Root);
					}
				}
				te.UnlockUpdate();
			}
			Resize();
		},

		CreateTC: async function (freeTC, Left, Top, Width, Height, Style, Align, TabWidth, TabHeight) {
			let TC;
			if (freeTC.length) {
				TC = freeTC.shift();
				TC.Left = Left;
				TC.Top = Top;
				TC.Width = Width;
				TC.Height = Height;
				TC.Style = Style;
				TC.Align = Align;
				TC.TabWidth = TabWidth;
				TC.TabHeight = TabHeight;
				TC.Visible = true;
			} else {
				TC = await te.CreateCtrl(CTRL_TC, Left, Top, Width, Height, Style, Align, TabWidth, TabHeight);
			}
			TC.Data.Group = await te.Data.Tabgroups.Index;
			return TC;
		},

		Close: async function (nPos, bNotUpdate) {
			if (await te.Data.Tabgroups.Data[nPos - 1].Lock || (!bNotUpdate && !await confirmOk())) {
				return;
			}
			let cTC = await te.Ctrls(CTRL_TC);
			let i = await cTC.Count;
			if (i > 1) {
				while (--i >= 0) {
					let TC = await cTC[i];
					if (await TC.Data.Group == nPos) {
						TC.Close();
					} else if (await TC.Data.Group > nPos) {
						TC.Data.Group = await TC.Data.Group - 1;
					}
				}
			}
			await te.Data.Tabgroups.Data.splice(nPos - 1, 1);
			let nLen = await GetLength(await te.Data.Tabgroups.Data);
			if (await te.Data.Tabgroups.Index >= nLen + 1 && await te.Data.Tabgroups.Index > 1) {
				te.Data.Tabgroups.Index = await te.Data.Tabgroups.Index - 1;
			}
			if (!bNotUpdate) {
				let cTC = await te.Ctrls(CTRL_TC);
				for (let i = await cTC.Count; --i >= 0;) {
					let TC = await cTC[i];
					if (await TC.Data.Group == await te.Data.Tabgroups.Index) {
						TC.Visible = true;
					}
				}
				await this.Arrange();
			}
		},

		CloseOther: async function (nPos) {
			if (await confirmOk()) {
				let nLen = await GetLength(te.Data.Tabgroups.Data);
				for (let i = nLen; i--;) {
					if (i != nPos - 1) {
						await this.Close(i + 1, true);
					}
				}
				await this.Arrange();
			}
		},

		Down: function (ev, o) {
			this.buttons = (ev.buttons != null ? ev.buttons : ev.button);
			this.dtDown = new Date().getTime();
			if ((ev.buttons != null ? ev.buttons : ev.button) == 1) {
				Common.Tabgroups.pt.x = ev.screenX * ui_.Zoom;
				Common.Tabgroups.pt.y = ev.screenY * ui_.Zoom;
				let n = o.id.replace(/\D/g, '') - 0;
				this.Change(n);
			}
			return true;
		},

		Up: function (o) {
			if (this.buttons == 4) {
				this.Close(o.id.replace(/\D/g, ''));
				return false;
			}
		},

		Drop: async function (nDrag, nDrop) {
			if (nDrag != nDrop) {
				let nLen = await GetLength(await te.Data.Tabgroups.Data);
				let ar = [];
				let Data = [];
				for (let i = 0; i < nLen; ++i) {
					Data.push(await te.Data.Tabgroups.Data[i]);
				}
				let j = 0;
				for (let i = 0; i < nLen; ++i) {
					if (j == nDrop - 1) {
						j++;
					}
					ar[i] = (i == nDrag - 1) ? nDrop - 1 : j++;
				}
				for (let i = 0; i < nLen; ++i) {
					te.Data.Tabgroups.Data[ar[i]] = Data[i];
				}
				let cTC = await te.Ctrls(CTRL_TC);
				let nCount = await cTC.Count;
				for (let i = 0; i < nCount; ++i) {
					let TC = await cTC[i];
					if (await TC.Data.Group > ar.length) {
						TC.Close();
					} else {
						TC.Data.Group = ar[await TC.Data.Group - 1] + 1;
					}
				}
				te.Data.Tabgroups.Click = nDrop;
				Addons.Tabgroups.Arrange();
			}
			return true;
		},

		Popup: async function (ev, o) {
			te.Data.Tabgroups.Click = o.id.replace(/\D/g, '') - 0;
			let hMenu = await api.CreatePopupMenu();
			let sMenu = [1, "Rename", 5, "Color", 0, "", 2, "&Close Tab", 3, "Cl&amp;ose Other Tabs", 0, "", 4, "&New Tab", 6, "&Lock", 0, "", 7, "Load", 8, "Save"];
			for (let i = sMenu.length / 2; i--;) {
				let uId = sMenu[i * 2];
				let uFlags = uId ? MF_STRING : MF_SEPARATOR;
				if (await te.Data.Tabgroups.Data[await te.Data.Tabgroups.Click - 1].Lock) {
					if (uId == 2) {
						uFlags |= MF_DISABLED;
					}
					if (uId == 6) {
						uFlags |= MF_CHECKED;
					}
				}
				await api.InsertMenu(hMenu, 0, MF_BYPOSITION | uFlags, uId, await GetText(sMenu[i * 2 + 1]));
			}
			let x = ev.screenX * ui_.Zoom;
			let y = ev.screenY * ui_.Zoom;
			pt.x = x;
			pt.y = y;
			let nVerb = await api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, x, y, await te.hwnd, null, null);
			api.DestroyMenu(hMenu);
			switch (nVerb) {
				case 1:
					this.Edit(o);
					break;
				case 2:
					this.Close(await te.Data.Tabgroups.Click);
					break;
				case 3:
					this.CloseOther(await te.Data.Tabgroups.Click);
					break;
				case 4:
					Sync.Tabgroups.Add();
					break;
				case 5:
					this.SetColor();
					break;
				case 6:
					this.Lock();
					break;
				case 7:
					this.Load();
					break;
				case 8:
					this.Save();
					break;
			}
		},

		Edit: async function (o) {
			let s = await InputDialog(await GetText("Name"), await te.Data.Tabgroups.Data[await te.Data.Tabgroups.Click - 1].Name);
			if (s) {
				o.value = s;
				te.Data.Tabgroups.Data[await te.Data.Tabgroups.Click - 1].Name = s;
				this.Arrange();
			}
		},

		SetColor: async function () {
			te.Data.Tabgroups.Data[await te.Data.Tabgroups.Click - 1].Color = await ChooseWebColor(await te.Data.Tabgroups.Data[await te.Data.Tabgroups.Click - 1].Color);
			this.Arrange();
		},

		Lock: async function () {
			let i = await te.Data.Tabgroups.Click - 1;
			te.Data.Tabgroups.Data[i].Lock = await te.Data.Tabgroups.Data[i].Lock ? 0 : 1;
			this.Arrange();
		},

		Fix: async function () {
			let cTC = await te.Ctrls(CTRL_TC, true);
			let nCount = await cTC.Count;
			for (let i = 0; i < nCount; ++i) {
				let TC = await cTC[i];
				if (!await TC.Data.Group) {
					TC.Data.Group = await te.Data.Tabgroups.Index;
				}
			}
			let TC = await te.Ctrl(CTRL_TC);
			if (TC) {
				Addons.Tabgroups.Focused[await te.Data.Tabgroups.Index] = await TC.Id;
			}
		},

		Over: function (nIndex) {
			Addons.Tabgroups.ClearTid();
			Addons.Tabgroups.tid = setTimeout(async function () {
				delete Addons.Tabgroups.tid;
				let pt = await api.Memory("POINT");
				await api.GetCursorPos(pt);
				if (!await Common.Tabgroups.Drag5 && !await IsDrag(pt, await Common.Tabgroups.pt)) {
					Addons.Tabgroups.Change(nIndex);
				}
			}, 300);
		},

		ClearTid: function () {
			if (Addons.Tabgroups.tid) {
				clearTimeout(Addons.Tabgroups.tid);
				Addons.Tabgroups.tid = void 0;
			}
		},

		Move: async function (ev, o) {
			if (await api.GetKeyState(VK_LBUTTON) < 0) {
				let pt = await api.Memory("POINT");
				pt.x = ev.screenX * ui_.Zoom;
				pt.y = ev.screenY * ui_.Zoom;
				if (await IsDrag(pt, Common.Tabgroups.pt)) {
					let pdwEffect = [DROPEFFECT_COPY | DROPEFFECT_MOVE | DROPEFFECT_LINK];
					let dataObj = await api.CreateObject("FolderItems");
					dataObj.SetData("");
					Common.Tabgroups.Drag5 = o.id;
					api.SHDoDragDrop(null, dataObj, te, pdwEffect[0], pdwEffect);
					Common.Tabgroups.Drag5 = void 0;
				}
			}
		},

		Start5: function (ev, o) {
			ev.dataTransfer.effectAllowed = 'move';
			Common.Tabgroups.Drag5 = o.id;
			return this.buttons == 1;
		},

		End5: function () {
			Common.Tabgroups.Drag5 = void 0;
		},

		Wheel: async function (ev) {
			let n = await te.Data.Tabgroups.Click + (isFinite(ev) ? ev : - ev.wheelDelta / 120);
			let nLen = await GetLength(await te.Data.Tabgroups.Data);
			if (n < 1) {
				n = nLen;
			}
			if (n >= nLen + 1) {
				n = 1;
			}
			this.Change(n);
		}
	};

	Common.Tabgroups = await api.CreateObject("Object");
	Common.Tabgroups.pt = await api.Memory("POINT");
	Common.Tabgroups.DragOpen = !GetNum(item.getAttribute("NoDragOpen"));

	$.importScript("addons\\" + Addon_Id + "\\sync.js");

	Addons.Tabgroups.Init();

	AddEvent("Load", function () {
		Addons.Tabgroups.ImgLock = Addons.TabPlus ? Addons.TabPlus.ImgLock2 : '<img src="' + MakeImgSrc("bitmap:ieframe.dll,545,13,2", 0, false, 13) + '" style="width: 13px; padding-right: 2px">';

		setTimeout(Addons.Tabgroups.Arrange, 500);
	});
} else {
	SetTabContents(0, "General", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));
}
