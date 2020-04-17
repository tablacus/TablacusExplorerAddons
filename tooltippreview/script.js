var Addon_Id = "tooltippreview";
var item = GetAddonElement(Addon_Id);

if (window.Addon == 1) {
	Addons.TooltipPreview = {
		MAX: 400,
		cx: 0,
		artm: [99, 99, 99, 500, 999].reverse(),
		Extract: api.LowPart(item.getAttribute("IsExtract")) ? item.getAttribute("Extract") || "*" : "-",
		Folder: api.LowPart(item.getAttribute("Folder")),
		TextFilter: api.LowPart(item.getAttribute("NoTextFilter")) ? "-" : item.getAttribute("TextFilter") || "*.txt;*.ini;*.css;*.js;*.vba;*.vbs",
		Charset: item.getAttribute("Charset"),
		TextSize: item.getAttribute("TextSize") || 4000,
		TextLimit: item.getAttribute("TextLimit") || 10000000,

		Draw: function () {
			Addons.TooltipPreview.DeleteBM();
			var q = Addons.TooltipPreview.q;
			if (!q.image) {
				return;
			}
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
				Addons.TooltipPreview.MAX = Math.max(api.SendMessage(q.hwnd, WM_USER + 25, 0, 0), 400);
				Addons.TooltipPreview.Path = q.Item.Path;
				if (api.IsWindowVisible(q.hwnd)) {
					var hdc = api.GetWindowDC(q.hwnd);
					if (hdc) {
						q.image.Frame = 0;
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
						var bAnime = false;
						if (q.image.GetFrameCount() > 1) {
							var nDelay = q.image.GetFrameMetadata("/grctlext/Delay");
							bAnime = nDelay !== undefined || api.PathMatchSpec(q.Item.Path, "*.gif");
						}
						Addons.TooltipPreview.q.image.Frame = 0;
						q.x = (w1 - q.w * q.z) / 2 + 4;
						q.y = Math.max((h1 - q.h * q.z) / 2, Addons.TooltipPreview.cy / 3);
						if (bAnime) {
							var hmdc = api.CreateCompatibleDC(hdc);
							var d = q.image.GetFrameMetadata("/grctlext/Disposal");
							if (d == 3) {
								Addons.TooltipPreview.hbm2 = api.CreateCompatibleBitmap(hdc, q.w, q.h);
								var hOld1 = api.SelectObject(hmdc, Addons.TooltipPreview.hbm2);
								api.StretchBlt(hmdc, 0, 0, q.w, q.h, hdc, q.x, q.y, q.w * q.z, q.h * q.z, SRCCOPY);
								api.SelectObject(hmdc, hOld1);
							}
							Addons.TooltipPreview.hbm = api.CreateCompatibleBitmap(hdc, q.w * q.z, q.h * q.z);
							var hOld1 = api.SelectObject(hmdc, Addons.TooltipPreview.hbm);
							api.BitBlt(hmdc, 0, 0, q.w * q.z, q.h * q.z, hdc, q.x, q.y, SRCCOPY);
							api.SelectObject(hmdc, hOld1);

							q.xf = api.LowPart(q.image.GetFrameMetadata("/imgdesc/Left"));
							q.yf = api.LowPart(q.image.GetFrameMetadata("/imgdesc/Top"));
							var hdc2 = api.CreateCompatibleDC(hdc);
							var hbm2 = api.CreateCompatibleBitmap(hdc, q.w, q.h);
							var hOld2 = api.SelectObject(hdc2, hbm2);
							api.StretchBlt(hdc2, 0, 0, q.w, q.h, hdc, q.x, q.y, q.w * q.z, q.h * q.z, SRCCOPY);
							q.image.DrawEx(hdc2, 0, 0, 0, 0, CLR_NONE, CLR_NONE, ILD_NORMAL);
							api.StretchBlt(hdc, q.x, q.y, q.w * q.z, q.h * q.z, hdc2, 0, 0, q.w, q.h, SRCCOPY);
							api.SelectObject(hdc2, hOld2);
							api.DeleteDC(hdc2);
							api.DeleteObject(hbm2);
							api.SelectObject(hmdc, hOld1);
							if (d != 3) {
								Addons.TooltipPreview.hbm2 = api.CreateCompatibleBitmap(hdc, q.w, q.h);
								hmdc = api.CreateCompatibleDC(hdc);
								hOld1 = api.SelectObject(hmdc, Addons.TooltipPreview.hbm2);
								api.StretchBlt(hmdc, 0, 0, q.w, q.h, hdc, q.x, q.y, q.w * q.z, q.h * q.z, SRCCOPY);
								api.SelectObject(hmdc, hOld1);
							}
							api.DeleteDC(hmdc);
							setTimeout(Addons.TooltipPreview.Animate, nDelay * 10 || 100);
						} else {
							var thumb = GetThumbnail(q.image, Math.max(q.w * q.z, q.h * q.z), true);
							if (thumb) {
								thumb.DrawEx(hdc, q.x, q.y, 0, 0, CLR_NONE, CLR_NONE, ILD_NORMAL);
							}
						}
					}
					api.ReleaseDC(q.hwnd, hdc);
				}
			} else if (Addons.TooltipPreview.tm) {
				Addons.TooltipPreview.tid = setTimeout(Addons.TooltipPreview.Draw, Addons.TooltipPreview.artm[--Addons.TooltipPreview.tm]);
			}
		},

		Animate: function () {
			if (Addons.TooltipPreview.tid) {
				clearTimeout(Addons.TooltipPreview.tid);
				delete Addons.TooltipPreview.tid;
			}
			var q = Addons.TooltipPreview.q;
			if (api.IsWindowVisible(q.hwnd)) {
				var d = q.image.GetFrameMetadata("/grctlext/Disposal");
				q.image.Frame = (q.image.Frame + 1) % q.image.GetFrameCount();
				var hdc = api.GetWindowDC(q.hwnd);
				if (hdc) {
					var x = api.LowPart(q.image.GetFrameMetadata("/imgdesc/Left")) - q.xf;
					var y = api.LowPart(q.image.GetFrameMetadata("/imgdesc/Top")) - q.yf;

					var hdc2 = api.CreateCompatibleDC(hdc);
					var hbm2 = api.CreateCompatibleBitmap(hdc, q.w, q.h);
					var hOld2 = api.SelectObject(hdc2, hbm2);
					var hmdc = api.CreateCompatibleDC(hdc);
					var hOld1;
					if (d != 2) {
						hOld1 = api.SelectObject(hmdc, Addons.TooltipPreview.hbm2);
						api.BitBlt(hdc2, 0, 0, q.w, q.h, hmdc, 0, 0, SRCCOPY);
					} else {
						hOld1 = api.SelectObject(hmdc, Addons.TooltipPreview.hbm);
						api.StretchBlt(hdc2, 0, 0, q.w, q.h, hmdc, 0, 0, q.w * q.z, q.h * q.z, SRCCOPY);
					}
					q.image.DrawEx(hdc2, x, y, 0, 0, CLR_NONE, CLR_NONE, ILD_NORMAL);
					api.StretchBlt(hdc, q.x, q.y, q.w * q.z, q.h * q.z, hdc2, 0, 0, q.w, q.h, SRCCOPY);
					api.SelectObject(hmdc, hOld1);
					if (d != 3) {
						hOld1 = api.SelectObject(hmdc, Addons.TooltipPreview.hbm2);
						api.BitBlt(hmdc, 0, 0, q.w, q.h, hdc2, 0, 0, SRCCOPY);
						api.SelectObject(hmdc, hOld1);
					}
					api.DeleteDC(hmdc);

					api.SelectObject(hdc2, hOld2);
					api.DeleteDC(hdc2);
					api.DeleteObject(hbm2);
					api.ReleaseDC(q.hwnd, hdc);
					setTimeout(Addons.TooltipPreview.Animate, q.image.GetFrameMetadata("/grctlext/Delay") * 10 || 100);
				}
			}
		},

		DeleteBM: function () {
			if (Addons.TooltipPreview.tid) {
				clearTimeout(Addons.TooltipPreview.tid);
				delete Addons.TooltipPreview.tid;
			}
			if (Addons.TooltipPreview.hbm) {
				api.DeleteObject(Addons.TooltipPreview.hbm);
				delete Addons.TooltipPreview.hbm;
			}
			if (Addons.TooltipPreview.hbm2) {
				api.DeleteObject(Addons.TooltipPreview.hbm2);
				delete Addons.TooltipPreview.hbm2;
			}
		}
	};

	AddEvent("ToolTip", function (Ctrl, Index) {
		if (Ctrl.Type <= CTRL_EB && Index >= 0) {
			if (Addons.TooltipPreview.tid) {
				clearTimeout(Addons.TooltipPreview.tid);
				delete Addons.TooltipPreview.tid;
			}
			var Item = Ctrl.Item(Index);
			if (Item) {
				if (!Addons.TooltipPreview.Folder && IsFolderEx(Item)) {
					return;
				}
				if (PathMatchEx(Item.Path, Addons.TooltipPreview.TextFilter)) {
					if (Item.ExtendedProperty("size") <= Addons.TooltipPreview.TextLimit) {
						var ado = OpenAdodbFromTextFile(Item.Path, Addons.TooltipPreview.Charset);
						if (ado) {
							var s = ado.ReadText(Addons.TooltipPreview.TextSize);
							ado.Close()
							return s;
						}
					}
				}
				var q = { Item: Item, path: Item };
				Addons.TooltipPreview.q = q;
				q.w = Item.ExtendedProperty("{6444048F-4C8B-11D1-8B70-080036B11A03} 3");
				q.h = Item.ExtendedProperty("{6444048F-4C8B-11D1-8B70-080036B11A03} 4");
				if (q.w && q.h) {
					q.onload = function (q) {
						q.image = api.CreateObject("WICBitmap").FromSource(q.out);
						Addons.TooltipPreview.Draw();
					}
					Threads.GetImage(Addons.TooltipPreview.q);
				} else {
					q.image = api.CreateObject("WICBitmap").FromFile(q.path);
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
					if (q.image) {
						q.w = q.image.GetWidth();
						q.h = q.image.GetHeight();
						Addons.TooltipPreview.tid = setTimeout(Addons.TooltipPreview.Draw, 99);
					}
				}
				Addons.TooltipPreview.tm = Addons.TooltipPreview.artm.length;
				delete Addons.TooltipPreview.Path;
				if (q.w && q.h) {
					q.z = Math.min(Addons.TooltipPreview.MAX / Math.max(q.w, q.h), 1);
					var s = "";
					if (Addons.TooltipPreview.cx == 0) {
						var hdc = api.GetWindowDC(null);
						if (hdc) {
							var size = api.Memory("SIZE");
							api.GetTextExtentPoint32(hdc, " ", size);
							Addons.TooltipPreview.cx = size.cx * .7;
							Addons.TooltipPreview.cy = size.cy;
							api.ReleaseDC(null, hdc);
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
					Addons.TooltipPreview.DeleteBM();
					Addons.TooltipPreview.tm = Addons.TooltipPreview.artm.length;
					Addons.TooltipPreview.tid = setTimeout(Addons.TooltipPreview.Draw, 999);
				}
			}
		}
	});

	AddEvent("Finalize", Addons.TooltipPreview.DeleteBM);

} else {
	var ado = OpenAdodbFromTextFile("addons\\" + Addon_Id + "\\options.html");
	if (ado) {
		SetTabContents(0, "", ado.ReadText(adReadAll));
		ado.Close();
	}
}
