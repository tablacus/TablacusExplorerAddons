var Addon_Id = "tooltippreview";
var item = GetAddonElement(Addon_Id);

if (window.Addon == 1) {
	Addons.TooltipPreview = {
		MAX: 400,
		SIZE: api.Memory("SIZE"),
		cx: 0,
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
						var rc = api.Memory("RECT");
						api.GetClientRect(q.hwnd, rc);
						var w1 = rc.right - rc.left - 8;
						var h1 = rc.bottom - rc.top - Addons.TooltipPreview.nCols * Addons.TooltipPreview.cy - 4;
						var z = q.z;
						if (w1 < q.w * z) {
							q.z = Math.min(z, w1 / q.w);
							Addons.TooltipPreview.cx = w1 / Addons.TooltipPreview.cxn;
						}
						if (h1 < q.h * z) {
							q.z = Math.min(q.z, h1 / q.h);
							Addons.TooltipPreview.cy = h1 / Addons.TooltipPreview.cyn;
						}
						Addons.TooltipPreview.q.image.Frame = 0;
						q.x = (rc.right - rc.left - q.w * q.z) / 2;
						q.y = Addons.TooltipPreview.cy / 3;
						Addons.TooltipPreview.DeleteBG();
						Addons.TooltipPreview.hmdc = api.CreateCompatibleDC(hdc);
						Addons.TooltipPreview.hbmBk = api.CreateCompatibleBitmap(hdc, q.w * q.z, q.h * q.z);
						Addons.TooltipPreview.hOld = api.SelectObject(Addons.TooltipPreview.hmdc, Addons.TooltipPreview.hbmBk);
						api.BitBlt(Addons.TooltipPreview.hmdc, 0, 0, q.w * q.z, q.h * q.z, hdc, q.x, q.y, SRCCOPY);
						q.xf = api.LowPart(q.image.GetFrameMetadata("/imgdesc/Left"));
						q.yf = api.LowPart(q.image.GetFrameMetadata("/imgdesc/Top"));
						var thumb = GetThumbnail(q.image, Math.max(q.w * q.z, q.h * q.z), true);
						thumb.DrawEx(hdc, q.x, q.y, 0, 0, CLR_NONE, CLR_NONE, ILD_NORMAL);
						q.image.Frame = 0;
					}
					api.ReleaseDC(q.hwnd, hdc);

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
					var x = (api.LowPart(q.image.GetFrameMetadata("/imgdesc/Left")) - q.xf) * q.z;
					var y = (api.LowPart(q.image.GetFrameMetadata("/imgdesc/Top")) - q.yf) * q.z;
					var hdc2, hbm2, hOld2;
					if (d && (hdc2 = api.CreateCompatibleDC(hdc))) {
						hbm2 = api.CreateCompatibleBitmap(hdc, q.w * q.z, q.h * q.z);
						hOld2 = api.SelectObject(hdc2, hbm2);
						api.BitBlt(hdc2, 0, 0, q.w * q.z, q.h * q.z, hdc, q.x, q.y, SRCCOPY);
						if (d == 2) {
							api.BitBlt(hdc2, 0, 0, q.w * q.z, q.h * q.z, Addons.TooltipPreview.hmdc, 0, 0, SRCCOPY);
						}
					} else {
						hdc2 = hdc;
						x += q.x;
						y += q.y;
					}
					var thumb = GetThumbnail(q.image, Math.max(q.image.GetWidth() * q.z, q.image.GetHeight() * q.z), true);
					if (thumb) {
						thumb.DrawEx(hdc2, x, y, 0, 0, CLR_NONE, CLR_NONE, ILD_NORMAL);
					}
					if (hdc != hdc2) {
						api.BitBlt(hdc, q.x, q.y, q.w * q.z, q.h * q.z, hdc2, 0, 0, SRCCOPY);
						api.SelectObject(hdc2, hOld2);
						api.DeleteDC(hdc2);
						api.DeleteObject(hbm2);
					}
					api.ReleaseDC(q.hwnd, hdc);
					setTimeout(Addons.TooltipPreview.Animate, q.image.GetFrameMetadata("/grctlext/Delay") * 10 || 100);
				}
			}
		},

		DeleteBG: function () {
			if (Addons.TooltipPreview.hmdc) {
				api.SelectObject(Addons.TooltipPreview.hmdcBk, Addons.TooltipPreview.hOld);
				api.DeleteDC(Addons.TooltipPreview.hmdc);
				api.DeleteObject(Addons.TooltipPreview.hbmBk);
				delete Addons.TooltipPreview.hmdc;
				delete Addons.TooltipPreview.hbmBk;
				delete Addons.TooltipPreview.hOld;
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
					q.z = Math.min(Addons.TooltipPreview.MAX / Math.max(q.w, q.h), 1);
					if (Addons.TooltipPreview.tid) {
						clearTimeout(Addons.TooltipPreview.tid);
					}
					Addons.TooltipPreview.tm = Addons.TooltipPreview.artm.length;
					Addons.TooltipPreview.tid = setTimeout(Addons.TooltipPreview.Draw, 99);
					var s = "";
					if (Addons.TooltipPreview.cx == 0) {
						var hdc = api.GetWindowDC(te.hwnd);
						if (hdc) {
							api.GetTextExtentPoint32(hdc, " ", Addons.TooltipPreview.SIZE);
							Addons.TooltipPreview.cx = Addons.TooltipPreview.SIZE.cx * .75;
							Addons.TooltipPreview.cy = Addons.TooltipPreview.SIZE.cy;
							api.ReleaseDC(te.hwnd, hdc);
						} else {
							Addons.TooltipPreview.cx = 6;
							Addons.TooltipPreview.cy = 12;
						}
					}
					Addons.TooltipPreview.cyn = Math.round(q.h * q.z / Addons.TooltipPreview.cy);
					var ar = new Array(Addons.TooltipPreview.cyn);
					Addons.TooltipPreview.cxn = Math.round(q.w * q.z / Addons.TooltipPreview.cx);
					ar.push(new Array(Addons.TooltipPreview.cxn).join(" "));
					var col = ["type", "write", "{6444048F-4C8B-11D1-8B70-080036B11A03} 13"];
					if (!IsFolderEx(Item)) {
						col.push("size");
					}
					for (var i = 0; i < col.length; i++) {
						var s = api.PSFormatForDisplay(col[i], Item.ExtendedProperty(col[i]), PDFF_DEFAULT);
						if (i != 2 || s) {
							ar.push(api.PSGetDisplayName(col[i]) + ": " + s);
						} else {
							ar.push(api.PSGetDisplayName(col[i]) + ": " + q.w + " x " + q.h);
						}
					}
					Addons.TooltipPreview.nCols = col.length;
					return ar.join("\n");
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
					Addons.TooltipPreview.tm = Addons.TooltipPreview.artm.length;
					Addons.TooltipPreview.tid = setTimeout(Addons.TooltipPreview.Draw, 999);
				}
			}
		}
	});

	AddEvent("Finalize", Addons.TooltipPreview.DeleteBG);

} else {
	var ado = OpenAdodbFromTextFile("addons\\" + Addon_Id + "\\options.html");
	if (ado) {
		SetTabContents(0, "", ado.ReadText(adReadAll));
		ado.Close();
	}
}