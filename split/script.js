var Addon_Id = "split";
var Default = "ToolBar1Right";

var item = await GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.Split = {
		NoTop: item.getAttribute("NoTop"),
		Close: item.getAttribute("Close"),

		Exec: async function (nMax, nMode) {
			var TC = [];
			await Addons.Split.Exec2(nMax, TC);
			switch (nMode) {
				case 1:
					TC[0].Left = 0;
					TC[0].Top = 0;
					TC[0].Width = "100%";
					TC[0].Height = "100%";
					break;
				case 2:
					TC[0].Left = 0;
					TC[0].Top = 0;
					TC[0].Width = "100%";
					TC[0].Height = "50%";
					TC[1].Left = 0;
					TC[1].Top = "50%";
					TC[1].Width = "100%";
					TC[1].Height = "50%";
					break;
				case 3:
					TC[0].Left = 0;
					TC[0].Top = 0;
					TC[0].Width = "50%";
					TC[0].Height = "100%";
					TC[1].Left = "50%";
					TC[1].Top = 0;
					TC[1].Width = "50%";
					TC[1].Height = "100%";
					break;
				case 4:
					TC[0].Left = 0;
					TC[0].Top = 0;
					TC[0].Width = "50%";
					TC[0].Height = "50%";
					TC[1].Left = "50%";
					TC[1].Top = 0;
					TC[1].Width = "50%";
					TC[1].Height = "50%";
					TC[2].Left = 0;
					TC[2].Top = "50%";
					TC[2].Width = "50%";
					TC[2].Height = "50%";
					TC[3].Left = "50%";
					TC[3].Top = "50%";
					TC[3].Width = "50%";
					TC[3].Height = "50%";
					break;
			}
			TC[0].Selected.Focus();
			RunEvent1("VisibleChanged", TC[0]);
		},

		Exec2: async function (nMax, TC) {
			var TC0 = await te.Ctrl(CTRL_TC);
			var cTC = await te.Ctrls(CTRL_TC);
			var ix = await Addons.Split.Sort(cTC);
			var Group = TC0 && await TC0.Count ? await TC0.Data.Group : 0;
			var freeTC = [];
			var nTC = 0;
			for (var i = await GetLength(cTC); i-- > 0;) {
				var TC1 = await cTC[ix[i].i];
				var Group1 = await TC1.Data.Group;
				if (Group1 == 0 || Group1 == Group) {
					if (await TC1.Count && nTC < nMax) {
						TC1.Visible = true;
						TC1.Data.Group = Group;
						TC[nTC++] = TC1;
					} else {
						TC1.Visible = false;
						TC1.Data.Group = 0;
						freeTC.push(TC1);
					}
				}
			}
			for (; nTC < nMax; nTC++) {
				var type = CTRL_SB;
				var viewmode = FVM_DETAILS;
				var flags = FWF_SHOWSELALWAYS | FWF_NOWEBVIEW;
				var icon = 0;
				var options = EBO_SHOWFRAMES | EBO_ALWAYSNAVIGATE;
				var viewflags = 8;
				if (TC[0]) {
					var FV = await TC[0].Selected;
					if (FV) {
						type = await FV.Type;
						viewmode = await FV.CurrentViewMode;
						flags = await FV.FolderFlags;
						icon = await FV.IconSize;
						options = await FV.Options;
						viewflags = await FV.ViewFlags;
					}
				}
				TC[nTC] = await Addons.Split.CreateTC(freeTC, 0, 0, 0, 0, await te.Data.Tab_Style, await te.Data.Tab_Align, await te.Data.Tab_TabWidth, await te.Data.Tab_TabHeight, Group);
				if (await TC[nTC].Count == 0) {
					await TC[nTC].Selected.Navigate2("about:blank", SBSP_NEWBROWSER, type, viewmode, flags, options, viewflags, icon, await te.Data.Tree_Align, await te.Data.Tree_Width, await te.Data.Tree_Style, await te.Data.Tree_EnumFlags, await te.Data.Tree_RootStyle, await te.Data.Tree_Root);
					TC[nTC].Visible = true;
				}
			}
			while (TC1 = freeTC.shift()) {
				if (Addons.Split.Close || await api.GetDisplayNameOf(TC1[0], SHGDN_FORPARSING) == "about:blank") {
					TC1.Close();
				}
			}
		},

		CreateTC: async function (freeTC, Left, Top, Width, Height, Style, Align, TabWidth, TabHeight, Group) {
			var TC;
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
			TC.Data.Group = Group;
			return TC;
		},

		SetButtons: async function (Addon_Id, Default, item, n, ar) {
			var s = [];
			for (var i = 0; i < ar.length; i++) {
				if (!item.getAttribute("No" + ar[i].id)) {
					s.push('<span class="button" onclick="Addons.Split', n, '.Exec(', ar[i].exec, ')" onmouseover="MouseOver(this)" onmouseout="MouseOut()"><img title="', ar[i].id, '" src="../addons/split', n, '/', ar[i].img || ar[i].id, '.png" style="width: 12pt"></span>');
				}
			}
			document.getElementById(Addon_Id).innerHTML = s.join("");
		},

		Sort: async function (cTC) {
			var ix = [];
			var rc = await api.Memory("RECT");
			for (var i = await GetLength(cTC); i--;) {
				api.GetWindowRect(await cTC[i].hwnd, rc);
				ix.push({
					i: i,
					Id: await cTC[i].Id,
					Visible: await cTC[i].Visible,
					top: await rc.top,
					left: await rc.left
				});
			}
			var Id = Addons.Split.NoTop ? await te.Ctrl(CTRL_TC).Id : -1;
			return ix.sort(
				function (b, a) {
					if (a.Id == Id) {
						return -1;
					}
					if (b.Id == Id) {
						return 1;
					}
					if (a.Visible) {
						if (b.Visible) {
							if (a.top > b.top) {
								return 1;
							} else if (a.top < b.top) {
								return -1;
							}
							return a.left - b.left;
						}
						return -1;
					}
					return b.Visible ? 1 : a.i - b.i;
				}
			);
		},

		Over: async function (e) {
			if (!/^Background$|^client$/i.test(e.srcElement.id)) {
				document.getElementById("client").style.cursor = "";
				return;
			}
			var r = await api.CreateObject("Array");
			var nCursor = 0, c = 6, d = 8;
			var cTC = await te.Ctrls(CTRL_TC, true);
			var nCount = await cTC.Count;
			var ar = [nCount];
			for (var i = nCount; i-- > 0;) {
				var TC = await cTC[i];
				var id = await TC.Id;
				var o = document.getElementById("Panel_" + id);
				if (!o) {
					return;
				}
				var right = o.offsetLeft + o.offsetWidth;
				var bottom = o.offsetTop + o.offsetHeight;
				if (await TC.Left && e.clientX > o.offsetLeft - d && e.clientX < o.offsetLeft + c) {
					var q = await api.CreateObject("Object");
					q.left = id;
					r.push(q);
					nCursor |= 1;
				}
				if (e.clientX > right - d && e.clientX < right + c) {
					var q = await api.CreateObject("Object");
					q.width = id;
					r.push(q);
					nCursor |= 1;
				}
				if (await TC.Top && e.clientY > o.offsetTop - d && e.clientY < o.offsetTop + c) {
					ar.push(e.clientY > o.offsetTop - d, e.clientY < o.offsetTop + c);
					var q = await api.CreateObject("Object");
					q.top = id;
					await r.push(q);
					nCursor |= 2;
				}
				if (e.clientY > bottom - d && e.clientY < bottom + c) {
					var q = await api.CreateObject("Object");
					q.height = id;
					await r.push(q);
					nCursor |= 2;
				}
			}
			if (nCursor) {
				var o = document.getElementById("client");
				o.style.cursor = nCursor == 1 ? "w-resize" : nCursor == 2 ? "s-resize" : "move";
				Addons.Split.hCursor = await api.LoadCursor(null, nCursor + 32643);
				api.SetCursor(Addons.Split.hCursor);
			}
			return r;
		},

		Down: async function (e) {
			var r = await Addons.Split.Over(e);
			if (r && await GetLength(r)) {
				api.SetCapture(await te.hwnd);
				Common.Split = r;
			}
		}
	};

	SetAddon(Addon_Id, Default, '<span id="' + Addon_Id + '"></span>');

	var o = document.getElementById("client");
	AddEventEx(o, "mouseover", Addons.Split.Over);
	AddEventEx(o, "mousedown", Addons.Split.Down);

	AddEvent("Load", async function () {
		Addons.Split.SetButtons(Addon_Id, Default, await GetAddonElement(Addon_Id), "",
		[
			{ id: "1x1", exec: "1, 1", img: "1tab" },
			{ id: "1x2", exec: "2, 2", img: "h2tabs" },
			{ id: "2x1", exec: "2, 3", img: "v2tabs" },
			{ id: "2x2", exec: "4, 4", img: "4tabs" }
		]);

		AddEvent("Arrange", async function (Ctrl, rc) {
			if (await Common.Split) {
				api.SetCursor(Addons.Split.hCursor);
				if (Addons.Split.tid) {
					clearTimeout(Addons.Split.tid);
				}
				Addons.Split.tid = setTimeout(async function () {
					if (await Common.Split) {
						api.SetCursor(Addons.Split.hCursor);
					}
				}, 500);
			}
		});
	});
	importJScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	SetTabContents(0, "General", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));
}
