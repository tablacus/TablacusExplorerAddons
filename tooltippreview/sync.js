const Addon_Id = "tooltippreview";
const item = GetAddonElement(Addon_Id);

Sync.TooltipPreview = {
	MAX: 400,
	cx: 0,
	Extract: GetNum(item.getAttribute("IsExtract")) ? item.getAttribute("Extract") || "*" : "-",
	Folder: GetNum(item.getAttribute("Folder")),
	TextFilter: GetNum(item.getAttribute("NoTextFilter")) ? "-" : item.getAttribute("TextFilter") || "*.txt;*.ini;*.css;*.js;*.vba;*.vbs",
	Charset: item.getAttribute("Charset"),
	TextSize: item.getAttribute("TextSize") || 4000,
	TextLimit: item.getAttribute("TextLimit") || 10000000,
	Selected: GetNum(item.getAttribute("Selected")),
	q: {},
	TT: {},

	Draw: function () {
		Sync.TooltipPreview.DeleteBM();
		const q = Sync.TooltipPreview.q;
		if (!q || !q.image || !q.hwnd) {
			return;
		}
		if (api.IsWindowVisible(q.hwnd) && q.image) {
			Sync.TooltipPreview.TT[q.hwnd] = q;
			if (api.IsWindowVisible(q.hwnd)) {
				const hdc = api.GetWindowDC(q.hwnd);
				if (hdc) {
					q.image.Frame = 0;
					const rc = api.Memory("RECT");
					api.GetClientRect(q.hwnd, rc);
					const w1 = rc.right - rc.left - 8;
					const h1 = Math.max(rc.bottom - rc.top - Sync.TooltipPreview.nCols * Sync.TooltipPreview.cy - 4, 16);
					const z = q.z;
					if (w1 < q.w * z) {
						q.z = Math.min(z, w1 / q.w);
						Sync.TooltipPreview.cx = w1 / Sync.TooltipPreview.cxn;
					}
					if (h1 < q.h * z) {
						q.z = Math.min(q.z, h1 / q.h);
						Sync.TooltipPreview.cy = Math.max(h1 / Sync.TooltipPreview.cyn, 1);
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

						q.xf = GetNum(q.image.GetFrameMetadata("/imgdesc/Left"));
						q.yf = GetNum(q.image.GetFrameMetadata("/imgdesc/Top"));
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
		}
	},

	Animate: function () {
		const q = Sync.TooltipPreview.q;
		if (api.IsWindowVisible(q.hwnd)) {
			const d = q.image.GetFrameMetadata("/grctlext/Disposal");
			q.image.Frame = (q.image.Frame + 1) % q.image.GetFrameCount();
			const hdc = api.GetWindowDC(q.hwnd);
			if (hdc) {
				const x = GetNum(q.image.GetFrameMetadata("/imgdesc/Left")) - q.xf;
				const y = GetNum(q.image.GetFrameMetadata("/imgdesc/Top")) - q.yf;

				const hdc2 = api.CreateCompatibleDC(hdc);
				const hbm2 = api.CreateCompatibleBitmap(hdc, q.w, q.h);
				const hOld2 = api.SelectObject(hdc2, hbm2);
				const hmdc = api.CreateCompatibleDC(hdc);
				let hOld1;
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
		if (Sync.TooltipPreview.hbm) {
			api.DeleteObject(Sync.TooltipPreview.hbm);
			delete Sync.TooltipPreview.hbm;
		}
		if (Sync.TooltipPreview.hbm2) {
			api.DeleteObject(Sync.TooltipPreview.hbm2);
			delete Sync.TooltipPreview.hbm2;
		}
	},

	Close: function (Ctrl) {
		if (Ctrl.Type <= CTRL_EB) {
			const cTT = Sync.TooltipPreview.TT;
			for (let hwnd in cTT) {
				if (cTT[hwnd].Id == Ctrl.Id) {
					delete cTT[hwnd];
				}
			}
		}
	}
};

AddEvent("ToolTip", function (Ctrl, Index, hwnd) {
	if (Ctrl.Type <= CTRL_EB && Index >= 0) {
		Sync.TooltipPreview.q = {
			del: new Date().getTime()
		};
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
		if (IsCloud(Item)) {
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
		const q = { Item: Item, path: Item, tm: new Date().getTime(), Id: Ctrl.Id };
		Sync.TooltipPreview.q = q;
		q.w = Item.ExtendedProperty("{6444048F-4C8B-11D1-8B70-080036B11A03} 3");
		q.h = Item.ExtendedProperty("{6444048F-4C8B-11D1-8B70-080036B11A03} 4");
		if (q.w && q.h) {
			q.onload = function (q) {
				q.image = api.CreateObject("WICBitmap").FromSource(q.out);
				api.InvalidateRect(q.hwnd, null, false);
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
			}
		}
		if (q.w && q.h) {
			if (Sync.TooltipPreview.cx == 0) {
				Sync.TooltipPreview.MAX = api.SendMessage(hwnd, WM_USER + 25, 0, 0) || 400;
				const hdc = api.GetWindowDC(hwnd);
				if (hdc) {
					const rc = api.Memory("RECT");
					api.DrawText(hdc, String.fromCharCode(0x2002), -1, rc, DT_CALCRECT);
					Sync.TooltipPreview.cx = rc.right * .7;
					Sync.TooltipPreview.cy = rc.bottom;
					api.ReleaseDC(hwnd, hdc);
				} else {
					Sync.TooltipPreview.cx = 6;
					Sync.TooltipPreview.cy = 13;
				}
			}
			q.z = Math.min(Sync.TooltipPreview.MAX / Math.max(q.w, q.h), 1);
			Sync.TooltipPreview.cyn = Math.max(Math.round(q.h * q.z / Sync.TooltipPreview.cy), 1);
			const ar = new Array(Sync.TooltipPreview.cyn);
			Sync.TooltipPreview.cxn = Math.max(Math.round(q.w * q.z / Sync.TooltipPreview.cx), 1);
			ar.push(new Array(Sync.TooltipPreview.cxn).join(String.fromCharCode(0x2002)));
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
	if (Ctrl.Type == CTRL_TE) {
		if (Index == WM_PAINT) {
			let q = Sync.TooltipPreview.q;
			if (new Date().getTime() - q.del < 999) {
				delete Sync.TooltipPreview.TT[hwnd];
			}
			if (new Date().getTime() - q.tm < 999) {
				q.hwnd = hwnd;
				if (Sync.TooltipPreview.q.image) {
					setTimeout(Sync.TooltipPreview.Draw);
				}
				return;
			}
			q = Sync.TooltipPreview.TT[hwnd];
			if (q && q.hwnd == hwnd) {
				Sync.TooltipPreview.q = q;
				setTimeout(Sync.TooltipPreview.Draw);
			}
		}
	}
});

AddEvent("ListViewCreated", Sync.TooltipPreview.Close);

AddEvent("Close", Sync.TooltipPreview.Close);

AddEvent("Finalize", Sync.TooltipPreview.DeleteBM);
