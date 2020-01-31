var Addon_Id = "tooltippreview";
var item = GetAddonElement(Addon_Id);

if (window.Addon == 1) {
	Addons.TooltipPreview = {
		MAX: 400,
		SIZE: api.Memory("SIZE"),
		artm: [99, 99, 99, 500, 999].reverse(),
		Extract: item.getAttribute("Extract") || "*",

		Draw: function () {
			delete Addons.TooltipPreview.tid;
			var q = Addons.TooltipPreview.q;
			if (!q.hwnd) {
				var hwnd;
				while (hwnd = api.FindWindowEx(null, hwnd, null, null)) {
					if (api.GetClassName(hwnd) == "tooltips_class32") {
						if (api.IsWindowVisible(hwnd)) {
							q.hwnd = hwnd;
							break;
						}
					}
				}
			}
			if (q.hwnd && api.IsWindowVisible(q.hwnd) && q.image) {
				var max = api.SendMessage(q.hwnd, WM_USER + 25, 0, 0);
				if (max < 400) {
					Addons.TooltipPreview.MAX = max;
				}
				Addons.TooltipPreview.Path = q.Item.Path;
				if (api.IsWindowVisible(q.hwnd)) {
					var hdc = api.GetWindowDC(q.hwnd);
					if (hdc) {
						var hbm = q.image.GetHBITMAP(GetSysColor(COLOR_WINDOW));
						if (hbm) {
							api.SetTextColor(hdc, GetSysColor(COLOR_WINDOWTEXT));;
							api.SetBkColor(hdc, GetSysColor(COLOR_WINDOW));;
							var hmdc = api.CreateCompatibleDC(hdc);
							var hOld = api.SelectObject(hmdc, hbm);
							var rc = api.Memory("RECT");
							api.GetClientRect(q.hwnd, rc);
							var w1 = rc.right-- - rc.left++;
							var h1 = rc.bottom-- - rc.top++;
							h1 -= Addons.TooltipPreview.SIZE.cy * 4;
							if (h1 < 32) {
								h1 = 32;
							}
							if (w1 < q.w * q.z) {
								q.z = (w1 - 2) / q.w;
								if (Addons.TooltipPreview.SIZE.cx > 1) {
									Addons.TooltipPreview.SIZE.cx--;
								}
							}
							if (h1 < q.h * q.z) {
								q.z = (h1 - 2) / q.h;
								if (Addons.TooltipPreview.SIZE.cy > 1) {
									Addons.TooltipPreview.SIZE.cy--;
								}
							}
							q.x = Math.max((w1 - q.w * q.z) / 2, 4);
							q.y = Math.max((h1 - q.h * q.z) / 2, 4);
							var brush = api.CreateSolidBrush(GetSysColor(COLOR_WINDOW));
							api.FillRect(hdc, rc, brush);
							api.DeleteObject(brush);
							q.rc2 = api.Memory("RECT");
							q.rc2.left = 4;
							q.rc2.top = q.h * q.z + q.y - 4;
							q.rc2.right = rc.right;
							q.rc2.bottom = rc.bottom;
							rc.bottom = q.rc2.top;
							q.rc = rc;
							q.xf = api.LowPart(q.image.GetFrameMetadata("/imgdesc/Left"));
							q.yf = api.LowPart(q.image.GetFrameMetadata("/imgdesc/Top"));
							api.StretchBlt(hdc, q.x, q.y, q.w * q.z, q.h * q.z, hmdc, 0, 0, q.w, q.h, SRCCOPY);
							api.SelectObject(hmdc, hOld);
							api.DeleteDC(hmdc);
							api.DeleteObject(hbm);
							q.image.Frame = 0;
							var lf = api.Memory("LOGFONT");
							lf.lfFaceName = DefaultFont.lfFaceName;
							lf.lfHeight = -11;
							lf.lfCharSet = DefaultFont.lfCharSet;
							var hFont = CreateFont(lf);
							var hfontOld = api.SelectObject(hdc, hFont);
							api.DrawText(hdc, Addons.TooltipPreview.Text, -1, q.rc2, DT_NOPREFIX | DT_END_ELLIPSIS);
							api.SelectObject(hdc, hfontOld);
						}
						api.ReleaseDC(q.hwnd, hdc);
					}
					if (q.image.GetFrameCount() > 1) {
						var nDelay = q.image.GetFrameMetadata("/grctlext/Delay");
						if (nDelay !== undefined || api.PathMatchSpec(q.Item.Path, "*.gif")) {
							setTimeout(Addons.TooltipPreview.Animate, nDelay * 10 || 100);
						}
					}
				}
			} else if (Addons.TooltipPreview.tm) {
				Addons.TooltipPreview.tid = setTimeout(Addons.TooltipPreview.Draw, Addons.TooltipPreview.artm[--Addons.TooltipPreview.tm]);
			}
		},

		Animate: function () {
			var q = Addons.TooltipPreview.q;
			if (api.IsWindowVisible(q.hwnd)) {
				var d = q.image.GetFrameMetadata("/grctlext/Disposal");
				q.image.Frame = (q.image.Frame + 1) % q.image.GetFrameCount();
				var hdc = api.GetWindowDC(q.hwnd);
				if (hdc) {
					var hbm = q.image.GetHBITMAP(-2);
					if (hbm) {
						var hmdc = api.CreateCompatibleDC(hdc);
						var hOld = api.SelectObject(hmdc, hbm);
						var x = q.x + (api.LowPart(q.image.GetFrameMetadata("/imgdesc/Left")) - q.xf) * q.z;
						var y = q.y + (api.LowPart(q.image.GetFrameMetadata("/imgdesc/Top")) - q.yf) * q.z;
						var w = q.image.GetWidth();
						var h = q.image.GetHeight();
						if (d == 2) {
							var brush = api.CreateSolidBrush(GetSysColor(COLOR_WINDOW));
							api.FillRect(hdc, q.rc, brush);
							api.DeleteObject(brush);
						}
						if (q.image.GetFrameMetadata("/grctlext/TransparencyFlag") !== 0) {
							api.AlphaBlend(hdc, x, y, w * q.z, h * q.z, hmdc, 0, 0, w, h, 0x01ff0000);
						} else {
							api.StretchBlt(hdc, x, y, w * q.z, h * q.z, hmdc, 0, 0, w, h, SRCCOPY);
						}
						api.SelectObject(hmdc, hOld);
						api.DeleteDC(hmdc);
						api.DeleteObject(hbm);
					}
					api.ReleaseDC(q.hwnd, hdc);
					var i = q.image.GetFrameMetadata("/grctlext/Delay") * 10;
					setTimeout(Addons.TooltipPreview.Animate, i > 10 ? i : 100);
				}
			}
		}
	};

	AddEvent("ToolTip", function (Ctrl, Index) {
		if (Ctrl.Type <= CTRL_EB && Index >= 0) {
			var Item = Ctrl.Item(Index);
			if (Item) {
				var q = { image: api.CreateObject("WICBitmap").FromFile(Item.Path), Item: Item };
				if (!q.image) {
					if (api.PathMatchSpec(Item.Path, Addons.TooltipPreview.Extract) && !IsFolderEx(Item)) {
						var Items = api.CreateObject("FolderItems");
						Items.AddItem(Item);
						te.OnBeforeGetData(Ctrl, Items, 11);
						if (IsExists(Item.Path)) {
							q.image = api.CreateObject("WICBitmap").FromFile(Item.Path);
						}
					}
				}
				Addons.TooltipPreview.q = q;
				delete Addons.TooltipPreview.Path;
				if (q.image) {
					q.w = q.image.GetWidth();
					q.h = q.image.GetHeight();
					q.z = Addons.TooltipPreview.MAX / Math.max(q.w, q.h);
					if (q.z > 1) {
						q.z = 1;
					}
					if (Addons.TooltipPreview.tid) {
						clearTimeout(Addons.TooltipPreview.tid);
					}
					Addons.TooltipPreview.tm = Addons.TooltipPreview.artm.length;
					Addons.TooltipPreview.tid = setTimeout(Addons.TooltipPreview.Draw, 99);
					var s = "";
					if (Addons.TooltipPreview.SIZE.cx == 0) {
						var hdc = api.GetWindowDC(te.hwnd);
						if (hdc) {
							api.GetTextExtentPoint32(hdc, " ", Addons.TooltipPreview.SIZE);
							api.ReleaseDC(te.hwnd, hdc);
						}
					}
					var ar = new Array(Math.floor(q.h * q.z / Addons.TooltipPreview.SIZE.cy) + 5);
					var col = ["type", "write", "{6444048F-4C8B-11D1-8B70-080036B11A03} 13"];
					if (!IsFolderEx(Item)) {
						col.push("size");
					}
					for (var i = col.length; i--;) {
						var s = api.PSFormatForDisplay(col[i], Item.ExtendedProperty(col[i]), PDFF_DEFAULT);
						if (i != 2 || s) {
							ar[i + 1] = " " + api.PSGetDisplayName(col[i]) + ": " + s;
						} else {
							ar[i + 1] = " " + api.PSGetDisplayName(col[i]) + ": " + q.w + " x " + q.h;
						}
					}
					ar.push(new Array(Math.floor(q.w * q.z / Addons.TooltipPreview.SIZE.cx * 1.5)).join(" "));
					Addons.TooltipPreview.Text = ar.slice(0, col.length + 1).join("\n");
					return ar.join(" \n");
				}
			}
		}
	});

	AddEvent("ListViewCreated", function (Ctrl) {
		delete Addons.TooltipPreview.Path;
	});

	AddEvent("MouseMessage", function (Ctrl, hwnd, msg, wParam, pt) {
		if (Addons.TooltipPreview.Path && msg == WM_MOUSEMOVE && Ctrl.Type == CTRL_SB) {
			var Item = Ctrl.HitTest(pt);
			if (Item && Item.Path == Addons.TooltipPreview.Path) {
				if (!api.IsWindowVisible(Addons.TooltipPreview.q.hwnd)) {
					if (Addons.TooltipPreview.tid) {
						clearTimeout(Addons.TooltipPreview.tid);
					}
					Addons.TooltipPreview.q.image.Frame = 0;
					Addons.TooltipPreview.tm = Addons.TooltipPreview.artm.length;
					Addons.TooltipPreview.tid = setTimeout(Addons.TooltipPreview.Draw, 999);
				}
			}
		}
	});
} else {
	var ado = OpenAdodbFromTextFile("addons\\" + Addon_Id + "\\options.html");
	if (ado) {
		SetTabContents(0, "", ado.ReadText(adReadAll));
		ado.Close();
	}
}