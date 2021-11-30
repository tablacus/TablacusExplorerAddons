const Addon_Id = "tooltippreview";
const item = GetAddonElement(Addon_Id);

Sync.TooltipPreview = {
	MAX: 400,
	cx: 0,
	artm: [99, 99, 99, 500, 999].reverse(),
	Extract: api.LowPart(item.getAttribute("IsExtract")) ? item.getAttribute("Extract") || "*" : "-",
	Folder: api.LowPart(item.getAttribute("Folder")),
	TextFilter: api.LowPart(item.getAttribute("NoTextFilter")) ? "-" : item.getAttribute("TextFilter") || "*.txt;*.ini;*.css;*.js;*.vba;*.vbs",
	Charset: item.getAttribute("Charset"),
	TextSize: item.getAttribute("TextSize") || 4000,
	TextLimit: item.getAttribute("TextLimit") || 10000000,
	Selected: api.LowPart(item.getAttribute("Selected")),

	Draw: function () {
		Sync.TooltipPreview.DeleteBM();
		const q = Sync.TooltipPreview.q;
		if (!q.image) {
			return;
		}
		if (!q.hwnd) {
			let hwnd;
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
			Sync.TooltipPreview.MAX = Math.max(api.SendMessage(q.hwnd, WM_USER + 25, 0, 0), 400);
			Sync.TooltipPreview.Path = q.Item.Path;
			if (api.IsWindowVisible(q.hwnd)) {
				const hdc = api.GetWindowDC(q.hwnd);
				if (hdc) {
					q.image.Frame = 0;
					const rc = api.Memory("RECT");
					api.GetClientRect(q.hwnd, rc);
					const w1 = rc.right - rc.left - 8;
					const h1 = rc.bottom - rc.top - Sync.TooltipPreview.nCols * Sync.TooltipPreview.cy - 4;
					const z = q.z;
					if (w1 < q.w * z) {
						q.z = Math.min(z, w1 / q.w);
						Sync.TooltipPreview.cx = w1 / Sync.TooltipPreview.cxn;
					}
					if (h1 < q.h * z) {
						q.z = Math.min(q.z, h1 / q.h);
						Sync.TooltipPreview.cy = h1 / Sync.TooltipPreview.cyn;
					}
					cr = false;
					let hOld1, nDelay, bAnime = false;
					if (q.image.GetFrameCount() > 1) {
						nDelay = q.image.GetFrameMetadata("/grctlext/Delay");
						bAnime = nDelay !== undefined || api.PathMatchSpec(q.Item.Path, "*.gif");
					}
					Sync.TooltipPreview.q.image.Frame = 0;
					q.x = (w1 - q.w * q.z) / 2 + 4;
					q.y = Math.max((h1 - q.h * q.z) / 2, Sync.TooltipPreview.cy / 3);
					if (bAnime) {
						let hmdc = api.CreateCompatibleDC(hdc);
						const d = q.image.GetFrameMetadata("/grctlext/Disposal");
						if (d == 3) {
							Sync.TooltipPreview.hbm2 = api.CreateCompatibleBitmap(hdc, q.w, q.h);
							hOld1 = api.SelectObject(hmdc, Sync.TooltipPreview.hbm2);
							api.StretchBlt(hmdc, 0, 0, q.w, q.h, hdc, q.x, q.y, q.w * q.z, q.h * q.z, SRCCOPY);
							api.SelectObject(hmdc, hOld1);
						}
						Sync.TooltipPreview.hbm = api.CreateCompatibleBitmap(hdc, q.w * q.z, q.h * q.z);
						hOld1 = api.SelectObject(hmdc, Sync.TooltipPreview.hbm);
						api.BitBlt(hmdc, 0, 0, q.w * q.z, q.h * q.z, hdc, q.x, q.y, SRCCOPY);
						api.SelectObject(hmdc, hOld1);

						q.xf = api.LowPart(q.image.GetFrameMetadata("/imgdesc/Left"));
						q.yf = api.LowPart(q.image.GetFrameMetadata("/imgdesc/Top"));
						const hdc2 = api.CreateCompatibleDC(hdc);
						const hbm2 = api.CreateCompatibleBitmap(hdc, q.w, q.h);
						const hOld2 = api.SelectObject(hdc2, hbm2);
						api.StretchBlt(hdc2, 0, 0, q.w, q.h, hdc, q.x, q.y, q.w * q.z, q.h * q.z, SRCCOPY);
						q.image.DrawEx(hdc2, 0, 0, 0, 0, CLR_NONE, CLR_NONE, ILD_NORMAL);
						api.StretchBlt(hdc, q.x, q.y, q.w * q.z, q.h * q.z, hdc2, 0, 0, q.w, q.h, SRCCOPY);
						api.SelectObject(hdc2, hOld2);
						api.DeleteDC(hdc2);
						api.DeleteObject(hbm2);
						api.SelectObject(hmdc, hOld1);
						if (d != 3) {
							Sync.TooltipPreview.hbm2 = api.CreateCompatibleBitmap(hdc, q.w, q.h);
							hmdc = api.CreateCompatibleDC(hdc);
							hOld1 = api.SelectObject(hmdc, Sync.TooltipPreview.hbm2);
							api.StretchBlt(hmdc, 0, 0, q.w, q.h, hdc, q.x, q.y, q.w * q.z, q.h * q.z, SRCCOPY);
							api.SelectObject(hmdc, hOld1);
						}
						api.DeleteDC(hmdc);
						setTimeout(Sync.TooltipPreview.Animate, nDelay * 10 || 100);
					} else {
						const thumb = GetThumbnail(q.image, Math.max(q.w * q.z, q.h * q.z), true);
						if (thumb) {
							thumb.DrawEx(hdc, q.x, q.y, 0, 0, CLR_NONE, CLR_NONE, ILD_NORMAL);
						}
					}
				}
				api.ReleaseDC(q.hwnd, hdc);
			}
		} else if (Sync.TooltipPreview.tm) {
			Sync.TooltipPreview.tid = setTimeout(Sync.TooltipPreview.Draw, Sync.TooltipPreview.artm[--Sync.TooltipPreview.tm]);
		}
	},

	Animate: function () {
		if (Sync.TooltipPreview.tid) {
			clearTimeout(Sync.TooltipPreview.tid);
			delete Sync.TooltipPreview.tid;
		}
		const q = Sync.TooltipPreview.q;
		if (api.IsWindowVisible(q.hwnd)) {
			const d = q.image.GetFrameMetadata("/grctlext/Disposal");
			q.image.Frame = (q.image.Frame + 1) % q.image.GetFrameCount();
			const hdc = api.GetWindowDC(q.hwnd);
			if (hdc) {
				const x = api.LowPart(q.image.GetFrameMetadata("/imgdesc/Left")) - q.xf;
				const y = api.LowPart(q.image.GetFrameMetadata("/imgdesc/Top")) - q.yf;

				const hdc2 = api.CreateCompatibleDC(hdc);
				const hbm2 = api.CreateCompatibleBitmap(hdc, q.w, q.h);
				const hOld2 = api.SelectObject(hdc2, hbm2);
				const hmdc = api.CreateCompatibleDC(hdc);
				if (d != 2) {
					hOld1 = api.SelectObject(hmdc, Sync.TooltipPreview.hbm2);
					api.BitBlt(hdc2, 0, 0, q.w, q.h, hmdc, 0, 0, SRCCOPY);
				} else {
					hOld1 = api.SelectObject(hmdc, Sync.TooltipPreview.hbm);
					api.StretchBlt(hdc2, 0, 0, q.w, q.h, hmdc, 0, 0, q.w * q.z, q.h * q.z, SRCCOPY);
				}
				q.image.DrawEx(hdc2, x, y, 0, 0, CLR_NONE, CLR_NONE, ILD_NORMAL);
				api.StretchBlt(hdc, q.x, q.y, q.w * q.z, q.h * q.z, hdc2, 0, 0, q.w, q.h, SRCCOPY);
				api.SelectObject(hmdc, hOld1);
				if (d != 3) {
					hOld1 = api.SelectObject(hmdc, Sync.TooltipPreview.hbm2);
					api.BitBlt(hmdc, 0, 0, q.w, q.h, hdc2, 0, 0, SRCCOPY);
					api.SelectObject(hmdc, hOld1);
				}
				api.DeleteDC(hmdc);

				api.SelectObject(hdc2, hOld2);
				api.DeleteDC(hdc2);
				api.DeleteObject(hbm2);
				api.ReleaseDC(q.hwnd, hdc);
				setTimeout(Sync.TooltipPreview.Animate, q.image.GetFrameMetadata("/grctlext/Delay") * 10 || 100);
			}
		}
	},

	DeleteBM: function () {
		if (Sync.TooltipPreview.tid) {
			clearTimeout(Sync.TooltipPreview.tid);
			delete Sync.TooltipPreview.tid;
		}
		if (Sync.TooltipPreview.hbm) {
			api.DeleteObject(Sync.TooltipPreview.hbm);
			delete Sync.TooltipPreview.hbm;
		}
		if (Sync.TooltipPreview.hbm2) {
			api.DeleteObject(Sync.TooltipPreview.hbm2);
			delete Sync.TooltipPreview.hbm2;
		}
	}
};

AddEvent("ToolTip", function (Ctrl, Index) {
	if (Ctrl.Type == CTRL_SB && Index >= 0) {
		if (Sync.TooltipPreview.tid) {
			clearTimeout(Sync.TooltipPreview.tid);
			delete Sync.TooltipPreview.tid;
		}
		const Item = Ctrl.Item(Index);
		if (!Item) {
			return;
		}
		if (Sync.TooltipPreview.Selected && !(api.SendMessage(Ctrl.hwndList, LVM_GETITEMSTATE, Index, LVIS_SELECTED) & LVIS_SELECTED)) {
			return;
		}
		if (!Sync.TooltipPreview.Folder && IsFolderEx(Item)) {
			return;
		}
		if (/[NO]/.test(Item.ExtendedProperty("Attributes"))) {
			return;
		}
		if (PathMatchEx(Item.Path, Sync.TooltipPreview.TextFilter)) {
			if (Item.ExtendedProperty("size") <= Sync.TooltipPreview.TextLimit) {
				const ado = OpenAdodbFromTextFile(Item.Path, Sync.TooltipPreview.Charset);
				if (ado) {
					const s = ado.ReadText(Sync.TooltipPreview.TextSize);
					ado.Close()
					return s;
				}
			}
		}
		const q = { Item: Item, path: Item };
		Sync.TooltipPreview.q = q;
		q.w = Item.ExtendedProperty("{6444048F-4C8B-11D1-8B70-080036B11A03} 3");
		q.h = Item.ExtendedProperty("{6444048F-4C8B-11D1-8B70-080036B11A03} 4");
		if (q.w && q.h) {
			q.onload = function (q) {
				q.image = api.CreateObject("WICBitmap").FromSource(q.out);
				Sync.TooltipPreview.Draw();
			}
			Threads.GetImage(Sync.TooltipPreview.q);
		} else {
			q.image = api.CreateObject("WICBitmap").FromFile(q.path);
			if (!q.image) {
				if (api.PathMatchSpec(Item.Path, Sync.TooltipPreview.Extract) && !IsFolderEx(Item)) {
					const Items = api.CreateObject("FolderItems");
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
				Sync.TooltipPreview.tid = setTimeout(Sync.TooltipPreview.Draw, 99);
			}
		}
		Sync.TooltipPreview.tm = Sync.TooltipPreview.artm.length;
		delete Sync.TooltipPreview.Path;
		if (q.w && q.h) {
			q.z = Math.min(Sync.TooltipPreview.MAX / Math.max(q.w, q.h), 1);
			if (Sync.TooltipPreview.cx == 0) {
				const hdc = api.GetWindowDC(Ctrl.hwndList);
				if (hdc) {
					const size = api.Memory("SIZE");
					api.GetTextExtentPoint32(hdc, " ", size);
					Sync.TooltipPreview.cx = size.cx * .7;
					Sync.TooltipPreview.cy = size.cy * .8;
					api.ReleaseDC(Ctrl.hwndList, hdc);
				} else {
					Sync.TooltipPreview.cx = 6;
					Sync.TooltipPreview.cy = 13;
				}
			}
			Sync.TooltipPreview.cyn = Math.max(Math.round(q.h * q.z / Sync.TooltipPreview.cy), 1);
			const ar = new Array(Sync.TooltipPreview.cyn);
			Sync.TooltipPreview.cxn = Math.max(Math.round(q.w * q.z / Sync.TooltipPreview.cx), 1);
			ar.push(new Array(Sync.TooltipPreview.cxn).join(" "));
			const col = ["type", "write", "{6444048F-4C8B-11D1-8B70-080036B11A03} 13"];
			if (!IsFolderEx(Item)) {
				col.push("size");
			}
			for (let i = 0; i < col.length; i++) {
				const s = api.PSFormatForDisplay(col[i], Item.ExtendedProperty(col[i]), PDFF_DEFAULT);
				if (i != 2 || s) {
					ar.push(api.PSGetDisplayName(col[i]) + ": " + s);
				} else {
					ar.push(api.PSGetDisplayName(col[i]) + ": " + q.w + " x " + q.h);
				}
			}
			Sync.TooltipPreview.nCols = col.length;
			return ar.join("\n");
		}
	}
});

AddEvent("ListViewCreated", function (Ctrl) {
	delete Sync.TooltipPreview.Path;
});

AddEvent("MouseMessage", function (Ctrl, hwnd, msg, wParam, pt) {
	if (Sync.TooltipPreview.Path && msg == WM_MOUSEMOVE && Ctrl.Type == CTRL_SB) {
		const Item = Ctrl.HitTest(pt);
		if (Item && Item.Path == Sync.TooltipPreview.Path) {
			if (!api.IsWindowVisible(Sync.TooltipPreview.q.hwnd)) {
				Sync.TooltipPreview.DeleteBM();
				Sync.TooltipPreview.tm = Sync.TooltipPreview.artm.length;
				Sync.TooltipPreview.tid = setTimeout(Sync.TooltipPreview.Draw, 999);
			}
		}
	}
});

AddEvent("Finalize", Sync.TooltipPreview.DeleteBM);
