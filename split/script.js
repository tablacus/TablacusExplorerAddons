var Addon_Id = "split";
var Default = "ToolBar1Right";

var item = GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.Split =
	{
		NoTop: item.getAttribute("NoTop"),
		Close: item.getAttribute("Close"),

		Exec: function (nMax, nMode) {
			var TC = [];
			Addons.Split.Exec2(nMax, TC);
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

		Exec2: function (nMax, TC) {
			var TC0 = te.Ctrl(CTRL_TC);
			var cTC = te.Ctrls(CTRL_TC);
			var ix = Addons.Split.Sort(cTC);
			var Group = TC0 && TC0.Count ? TC0.Data.Group : 0;
			var freeTC = [];
			var nTC = 0;
			for (var i = cTC.length; i-- > 0;) {
				var TC1 = cTC[ix[i]];
				if (TC1.Data.Group == 0 || TC1.Data.Group == Group) {
					if (TC1.Count && nTC < nMax) {
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
					var FV = TC[0].Selected;
					if (FV) {
						type = FV.Type;
						viewmode = FV.CurrentViewMode;
						flags = FV.FolderFlags;
						icon = FV.IconSize;
						options = FV.Options;
						viewflags = FV.ViewFlags;
					}
				}
				TC[nTC] = Addons.Split.CreateTC(freeTC, 0, 0, 0, 0, te.Data.Tab_Style, te.Data.Tab_Align, te.Data.Tab_TabWidth, te.Data.Tab_TabHeight, Group);
				if (TC[nTC].Count == 0) {
					TC[nTC].Selected.Navigate2("about:blank", SBSP_NEWBROWSER, type, viewmode, flags, options, viewflags, icon, te.Data.Tree_Align, te.Data.Tree_Width, te.Data.Tree_Style, te.Data.Tree_EnumFlags, te.Data.Tree_RootStyle, te.Data.Tree_Root);
					TC[nTC].Visible = true;
				}
			}
			while (TC1 = freeTC.shift()) {
				if (Addons.Split.Close || api.GetDisplayNameOf(TC1[0], SHGDN_FORPARSING) == "about:blank") {
					TC1.Close();
				}
			}
		},

		CreateTC: function (freeTC, Left, Top, Width, Height, Style, Align, TabWidth, TabHeight, Group) {
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
				TC = te.CreateCtrl(CTRL_TC, Left, Top, Width, Height, Style, Align, TabWidth, TabHeight);
			}
			TC.Data.Group = Group;
			return TC;
		},

		SetButtons: function (Addon_Id, Default, item, n, ar) {
			var s = [];
			for (var i = 0; i < ar.length; i++) {
				if (!item.getAttribute("No" + ar[i].id)) {
					s.push('<span class="button" onclick="Addons.Split', n, '.Exec(', ar[i].exec, ')" onmouseover="MouseOver(this)" onmouseout="MouseOut()"><img title="', ar[i].id, '" src="../addons/split', n, '/', ar[i].img || ar[i].id, '.png" style="width: 12pt"></span>');
				}
			}
			document.getElementById(Addon_Id).innerHTML = s.join("");
		},

		Sort: function (cTC) {
			var ix = [];
			for (var i = cTC.length; i--;) {
				ix.push(i);
			}
			var Id = Addons.Split.NoTop ? te.Ctrl(CTRL_TC).Id : -1;
			return ix.sort(
				function (b, a) {
					if (cTC[a].Id == Id) {
						return -1;
					}
					if (cTC[b].Id == Id) {
						return 1;
					}
					if (cTC[a].Visible) {
						if (cTC[b].Visible) {
							var rca = api.Memory("RECT");
							var rcb = api.Memory("RECT");
							api.GetWindowRect(cTC[a].hwnd, rca);
							api.GetWindowRect(cTC[b].hwnd, rcb);
							if (rca.Top > rcb.Top) {
								return 1;
							} else if (rca.Top < rcb.Top) {
								return -1;
							}
							return rca.Left - rcb.Left;
						}
						return -1;
					}
					return cTC[b].Visible ? 1 : a - b;
				}
			);
		},

		Over: function (e, bCursor) {
			var r = [], nCursor = 0, d = 8;
			var cTC = te.Ctrls(CTRL_TC, true);
			for (var i = cTC.length; i-- > 0;) {
				var id = cTC[i].Id;
				var o = document.getElementById("Panel_" + id);
				if (!o) {
					return;
				}
				var right = o.offsetLeft + o.offsetWidth;
				var bottom = o.offsetTop + o.offsetHeight;
				if (cTC[i].Left && e.clientX > o.offsetLeft - d && e.clientX < o.offsetLeft + d) {
					r.push({ left: id });
					nCursor |= 1;
				}
				if (e.clientX > right - d && e.clientX < right + d) {
					r.push({ width: id });
					nCursor |= 1;
				}
				if (cTC[i].Top && e.clientY > o.offsetTop - d && e.clientY < o.offsetTop + d) {
					r.push({ top: id });
					nCursor |= 2;
				}
				if (e.clientY > bottom - d && e.clientY < bottom + d) {
					r.push({ height: id });
					nCursor |= 2;
				}
			}
			if (nCursor) {
				var o = document.getElementById("client");
				o.style.cursor = nCursor == 1 ? "w-resize" : nCursor == 2 ? "s-resize" : "move";
				Addons.Split.hCursor = api.LoadCursor(null, nCursor + 32643);
				api.SetCursor(Addons.Split.hCursor);
			}
			return r;
		},

		Down: function (e) {
			var r = Addons.Split.Over(e);
			if (r && r.length) {
				api.SetCapture(te.hwnd);
				Addons.Split.Capture = r;
			}
		}
	};

	SetAddon(Addon_Id, Default, '<span id="' + Addon_Id + '"></span>');

	AddEvent("load", function () {
		Addons.Split.SetButtons(Addon_Id, Default, item, "",
		[
			{ id: "1x1", exec: "1, 1", img: "1tab" },
			{ id: "1x2", exec: "2, 2", img: "h2tabs" },
			{ id: "2x1", exec: "2, 3", img: "v2tabs" },
			{ id: "2x2", exec: "4, 4", img: "4tabs" }
		]);
	});

	var o = document.getElementById("client");
	AddEventEx(o, "mouseover", Addons.Split.Over);
	AddEventEx(o, "mousedown", Addons.Split.Down);

	AddEvent("MouseMessage", function (Ctrl, hwnd, msg, wParam, pt) {
		if (Addons.Split.Capture) {
			var rc = api.Memory("RECT");
			api.GetClientRect(te.hwnd, rc);
			rc.right -= te.offsetLeft + te.offsetRight;
			rc.bottom -= te.offsetTop + te.offsetBottom;
			var o = document.getElementById("Panel");

			api.ScreenToClient(te.hwnd, pt);
			pt.x -= te.offsetLeft;
			pt.y -= te.offsetTop;
			var arSet = [];
			for (var i = Addons.Split.Capture.length; i--;) {
				var v = Addons.Split.Capture[i];
				if (v.left) {
					var TC = te.Ctrl(CTRL_TC, v.left);
					var left = TC.Left;
					if ("string" === typeof left) {
						left = Number(String(left).replace(/%$/, "")) * rc.right / 100;
					}
					var width = TC.Width;
					if ("string" === typeof width) {
						width = Number(String(width).replace(/%$/, "")) * rc.right / 100;
					}
					width = Math.round(left + width - pt.x);
					if (width < 4) {
						nCursor = 0;
						break;
					}
					left = pt.x;
					if ("string" === typeof TC.Width) {
						width = (100 * width / rc.right).toFixed(2) + "%";
					}
					if ("string" === typeof TC.Left) {
						left = (100 * left / rc.right).toFixed(2) + "%";
					}
					arSet.push([TC, "Width", width]);
					arSet.push([TC, "Left", left]);
				}
				if (v.width) {
					var TC = te.Ctrl(CTRL_TC, v.width);
					var left = TC.Left;
					if ("string" === typeof left) {
						left = Number(String(left).replace(/%$/, "")) * rc.right / 100;
					}
					var width = Math.round(pt.x - left);
					if (width < 4) {
						arSet.length = 0;
						break;
					}
					if ("string" === typeof TC.Width) {
						width = (100 * width / rc.right).toFixed(2) + "%";
					}
					arSet.push([TC, "Width", width]);
				}
				if (v.top) {
					var TC = te.Ctrl(CTRL_TC, v.top);
					var top = TC.Top;
					if ("string" === typeof top) {
						top = Number(String(top).replace(/%$/, "")) * rc.bottom / 100;
					}
					var height = TC.Height;
					if ("string" === typeof height) {
						height = Number(String(height).replace(/%$/, "")) * rc.bottom / 100;
					}
					height = Math.round(top + height - pt.y);
					if (height < 4) {
						arSet.length = 0;
						break;
					}
					top = pt.y;
					if ("string" === typeof TC.height) {
						height = (100 * height / rc.bottom).toFixed(2) + "%";
					}
					if ("string" === typeof TC.top) {
						top = (100 * top / rc.bottom).toFixed(2) + "%";
					}
					arSet.push([TC, "Height", height]);
					arSet.push([TC, "Top", top]);
				}
				if (v.height) {
					var TC = te.Ctrl(CTRL_TC, v.height);
					var top = TC.Top;
					if ("string" === typeof top) {
						top = Number(String(top).replace(/%$/, "")) * rc.bottom / 100;
					}
					var height = Math.round(pt.y - top);
					if (height < 4) {
						arSet.length = 0;
						break;
					}
					if ("string" === typeof TC.height) {
						height = (100 * height / rc.bottom).toFixed(2) + "%";
					}
					arSet.push([TC, "Height", height]);
				}
			}
			if (arSet.length) {
				for (var i = arSet.length; i--;) {
					arSet[i][0][arSet[i][1]] = arSet[i][2];
				}
			}
			if (msg == WM_LBUTTONUP || api.GetKeyState(VK_LBUTTON) >= 0) {
				api.ReleaseCapture();
				delete Addons.Split.Capture;
			}
			return S_OK;
		}
	}, true);

	AddEvent("Load", function () {
		AddEvent("Arrange", function (Ctrl, rc) {
			if (Addons.Split.Capture) {
				api.SetCursor(Addons.Split.hCursor);
				if (Addons.Split.tid) {
					clearTimeout(Addons.Split.tid);
				}
				Addons.Split.tid = setTimeout(function () {
					if (Addons.Split.Capture) {
						api.SetCursor(Addons.Split.hCursor);
					}
				}, 500);
			}
		});
	});

} else {
	var ado = OpenAdodbFromTextFile("addons\\" + Addon_Id + "\\options.html");
	if (ado) {
		SetTabContents(0, "General", ado.ReadText(adReadAll));
		ado.Close();
	}
}
