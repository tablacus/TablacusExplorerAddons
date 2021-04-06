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
			const s = [];
			const o = document.getElementById("tabgroups");
			const tabs = o.getElementsByTagName("li");
			const nLen = await GetLength(await te.Data.Tabgroups.Data);
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
			const o = tabs[i - 1];
			if (!o) {
				return;
			}
			const data = await te.Data.Tabgroups.Data[i - 1];
			const r = await Promise.all([data.Name, data.Lock, data.Color, te.Data.Tabgroups.Index]);
			let s = [r[0]];
			if (r[1]) {
				s.unshift(Addons.Tabgroups.ImgLock);
			}
			o.innerHTML = s.join("");
			const style = o.style;
			let cl = r[2];
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
			if (i == r[3]) {
				o.className = Addons.Tabgroups.bTab ? 'activetab' : 'activemenu';
				style.zIndex = tabs.length;
			} else {
				if (Addons.Tabgroups.bTab) {
					o.className = i < r[3] ? 'tab' : 'tab2';
				} else {
					o.className = 'menu';
				}
				style.zIndex = tabs.length - i;
			}
			Common.Tabgroups.rcItem[i - 1] = await GetRect(o);
		},

		Change: async function (n, data, cb) {
			let oShow = {};
			if (n > 0) {
				te.Data.Tabgroups.Click = n;
			}
			const r = await Promise.all([te.Data.Tabgroups.Click, te.Data.Tabgroups.Index, GetLength(await te.Data.Tabgroups.Data)]);
			let nFocusedId = await Addons.Tabgroups.Focused[r[0]];
			await this.Fix();
			if (await r[0] != r[1] && r[0] < r[2] + 1) {
				te.Data.Tabgroups.Index = r[0];
				this.Arrange();
				te.LockUpdate();
				let bDisp = false;
				const freeTC = [];
				const preTC = [];
				const cTC = await te.Ctrls(CTRL_TC, false, window.chrome);
				for (let i = 0; i < cTC.length; i++) {
					const TC = cTC[i];
					if (await TC.Visible) {
						preTC.push(TC);
					} else if (!await TC.Data.Group) {
						freeTC.push(TC);
					}
					let b = await TC.Data.Group == await te.Data.Tabgroups.Index;
					if (b) {
						const s = (await Promise.all([TC.Left, TC.Top, TC.Width, TC.Height])).join(",");
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
							const PT = preTC[i];
							let r = await Promise.all([PT.Left, PT.Top, PT.Width, PT.Height, PT.Style, PT.Align, PT.TabWidth, PT.TabHeight]);
							const TC = await this.CreateTC(freeTC, r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7]);
							if (await TC.Count == 0) {
								const FV = await PT.Selected;
								if (FV) {
									const TV = await FV.TreeView;
									r = await Promise.all([FV.FolderItem, FV.Type, FV.CurrentViewMode, FV.FolderFlags, FV.Options, FV.ViewFlags, FV.IconSize, TV.Align, TV.Width, TV.Style, TV.EnumFlags, TV.RootStyle, TV.Root]);
								} else {
									r = await Promise.all([$.HOME_PATH, te.Data.View_Type, te.Data.View_ViewMode, te.Data.View_fFlags, te.Data.View_Options, te.Data.View_ViewFlags, te.Data.View_IconSize, te.Data.Tree_Align, te.Data.Tree_Width, te.Data.Tree_Style, te.Data.Tree_EnumFlags, te.Data.Tree_RootStyle, te.Data.Tree_Root]);

								}
								TC.Selected.Navigate2(r[0], SBSP_NEWBROWSER, r[1], r[2], r[3], r[4], r[5], r[6], r[7], r[8], r[9], r[10], r[11], r[12]);
								TC.Visible = true;
							}
						}
					} else {
						let r = await Promise.all([te.Data.Tab_Style, te.Data.Tab_Align, te.Data.Tab_TabWidth, te.Data.Tab_TabHeight, te.Data.Tabgroups.Index]);
						const TC = await this.CreateTC(freeTC, 0, 0, "100%", "100%", r[0], r[1], r[2], r[3]);
						TC.Data.Group = r[4];
						r = await Promise.all([$.HOME_PATH, te.Data.View_Type, te.Data.View_ViewMode, te.Data.View_fFlags, te.Data.View_Options, te.Data.View_ViewFlags, te.Data.View_IconSize, te.Data.Tree_Align, te.Data.Tree_Width, te.Data.Tree_Style, te.Data.Tree_EnumFlags, te.Data.Tree_RootStyle, te.Data.Tree_Root]);
						TC.Selected.Navigate2(r[0], SBSP_NEWBROWSER, r[1], r[2], r[3], r[4], r[5], r[6], r[7], r[8], r[9], r[10], r[11], r[12]);
					}
				}
				te.UnlockUpdate();
			}
			if (cb) {
				await cb(n, data);
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
			let cTC = await te.Ctrls(CTRL_TC, false, window.chrome);
			let i = cTC.length;
			if (i > 1) {
				while (--i >= 0) {
					const TC =cTC[i];
					if (await TC.Data.Group == nPos) {
						TC.Close();
					} else if (await TC.Data.Group > nPos) {
						TC.Data.Group = await TC.Data.Group - 1;
					}
				}
			}
			await te.Data.Tabgroups.Data.splice(nPos - 1, 1);
			const nLen = await GetLength(await te.Data.Tabgroups.Data);
			if (await te.Data.Tabgroups.Index >= nLen + 1 && await te.Data.Tabgroups.Index > 1) {
				te.Data.Tabgroups.Index = await te.Data.Tabgroups.Index - 1;
			}
			if (!bNotUpdate) {
				cTC = await te.Ctrls(CTRL_TC, false, window.chrome);
				for (let i = cTC.length; --i >= 0;) {
					const TC = cTC[i];
					if (await TC.Data.Group == await te.Data.Tabgroups.Index) {
						TC.Visible = true;
					}
				}
				await this.Arrange();
			}
		},

		CloseOther: async function (nPos) {
			if (await confirmOk()) {
				for (let i = await GetLength(await te.Data.Tabgroups.Data); i--;) {
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
				const n = o.id.replace(/\D/g, '') - 0;
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
				const nLen = await GetLength(await te.Data.Tabgroups.Data);
				const ar = [];
				const Data = [];
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
				const cTC = await te.Ctrls(CTRL_TC, false, window.chrome);
				for (let i = 0; i < cTC.length; ++i) {
					const TC = cTC[i];
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
			let sMenu = [1, "Rename", 5, "Color", 0, "", 2, "&Close Tab", 3, "Cl&amp;ose Other Tabs", 0, "", 4, "&New Tab", 6, "&Lock", 0, "", 7, "Load", 8, "Save", 9, "Copy"];
			for (let i = sMenu.length / 2; i--;) {
				const uId = sMenu[i * 2];
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
			const x = ev.screenX * ui_.Zoom;
			const y = ev.screenY * ui_.Zoom;
			pt.x = x;
			pt.y = y;
			let nVerb = await api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, x, y, ui_.hwnd, null, null);
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
					Sync.Tabgroups.Load();
					break;
				case 8:
					Sync.Tabgroups.Save();
					break;
				case 9:
					Sync.Tabgroups.Copy();
					break;
			}
		},

		Edit: async function (o) {
			const nIndex = await te.Data.Tabgroups.Click - 1;
			InputDialog(await GetText("Name"), await te.Data.Tabgroups.Data[nIndex].Name, async function (s) {
				if (s) {
					o.value = s;
					te.Data.Tabgroups.Data[nIndex].Name = s;
					Addons.Tabgroups.Arrange();
				}
			});
		},

		SetColor: async function () {
			te.Data.Tabgroups.Data[await te.Data.Tabgroups.Click - 1].Color = await ChooseWebColor(await te.Data.Tabgroups.Data[await te.Data.Tabgroups.Click - 1].Color);
			this.Arrange();
		},

		Lock: async function () {
			const i = await te.Data.Tabgroups.Click - 1;
			te.Data.Tabgroups.Data[i].Lock = await te.Data.Tabgroups.Data[i].Lock ? 0 : 1;
			this.Arrange();
		},

		Fix: async function () {
			const nIndex = await te.Data.Tabgroups.Index;
			const cTC = await te.Ctrls(CTRL_TC, true, window.chrome);
			for (let i = 0; i < cTC.length; ++i) {
				const TC = cTC[i];
				if (!await TC.Data.Group) {
					TC.Data.Group = Index;
				}
			}
			const TC = await te.Ctrl(CTRL_TC);
			if (TC) {
				Addons.Tabgroups.Focused[nIndex] = await TC.Id;
			}
		},

		Over: function (nIndex) {
			Addons.Tabgroups.ClearTid();
			Addons.Tabgroups.tid = setTimeout(async function () {
				delete Addons.Tabgroups.tid;
				const pt = await api.Memory("POINT");
				await api.GetCursorPos(pt);
				if (!await Common.Tabgroups.Drag5 && !await IsDrag(pt, await Common.Tabgroups.pt)) {
					Addons.Tabgroups.Change(nIndex);
				}
			}, 300);
		},

		ClearTid: function () {
			if (Addons.Tabgroups.tid) {
				clearTimeout(Addons.Tabgroups.tid);
				delete Addons.Tabgroups.tid;
			}
		},

		Move: async function (ev, o) {
			if (await api.GetKeyState(VK_LBUTTON) < 0) {
				const pt = await api.Memory("POINT");
				pt.x = ev.screenX * ui_.Zoom;
				pt.y = ev.screenY * ui_.Zoom;
				if (await IsDrag(pt, Common.Tabgroups.pt)) {
					const pdwEffect = [DROPEFFECT_COPY | DROPEFFECT_MOVE | DROPEFFECT_LINK];
					const dataObj = await api.CreateObject("FolderItems");
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
			const nLen = await GetLength(await te.Data.Tabgroups.Data);
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

	AddEvent("Layout", Addons.Tabgroups.Init);

	AddEvent("Load", function () {
		Addons.Tabgroups.ImgLock = Addons.TabPlus ? Addons.TabPlus.ImgLock2 : '<img src="' + MakeImgSrc("bitmap:ieframe.dll,545,13,2", 0, false, 13) + '" style="width: ' + (13 * 96 / screen.deviceYDPI) + 'px; padding-right: 2px">';

		setTimeout(Addons.Tabgroups.Arrange, 500);
	});

	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	SetTabContents(0, "General", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));
}
