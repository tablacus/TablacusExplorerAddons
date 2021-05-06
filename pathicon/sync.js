const Addon_Id = "pathicon";
const item = GetAddonElement(Addon_Id);

Sync.PathIcon = {
	Icon: {},
	fStyle: LVIS_CUT | LVIS_SELECTED,
	CONFIG: BuildPath(te.Data.DataFolder, "config\\pathicon.tsv"),

	GetIconImage: function (fn, Large) {
		fn = ExtractPath(te, fn);
		return api.CreateObject("WICBitmap").FromFile(fn) || MakeImgData(fn, 0, Large ? 48 : 16);
	},

	Exec: function (Ctrl, pt) {
		AddonOptions("pathicon", function () {
		}, { FV: GetFolderView(Ctrl, pt) });
	},

	Replace: function (path, s, l) {
		path = path.toLowerCase();
		let db = Sync.PathIcon.Icon[path];
		if (!db) {
			db = Sync.PathIcon.Icon[path] = {};
		}
		if (s) {
			Sync.PathIcon.bSave |= db[0] != s;
			db[0] = s;
			delete db[2];
		}
		if (l) {
			Sync.PathIcon.bSave |= db[1] != l;
			db[1] = l;
			delete db[3];
		}
		api.RedrawWindow(te.hwnd, null, 0, RDW_INVALIDATE | RDW_FRAME | RDW_ALLCHILDREN);
	},

	Remove: function (path, mode) {
		path = path.toLowerCase();
		const db = Sync.PathIcon.Icon[path];
		if (db) {
			mode = api.LowPart(mode);
			if (mode != 0) {
				Sync.PathIcon.bSave |= db[1] != "";
				delete db[1];
				delete db[3];
			}
			if (mode != 1) {
				Sync.PathIcon.bSave |= db[0] != "";
				delete db[0];
				delete db[2];
			}
			if (!db[0] && !db[1]) {
				delete Sync.PathIcon.Icon[path];
			}
			api.RedrawWindow(te.hwnd, null, 0, RDW_INVALIDATE | RDW_FRAME | RDW_ALLCHILDREN);
		}
	},

	ENumCB: function (fncb) {
		for (let path in Sync.PathIcon.Icon) {
			const db = Sync.PathIcon.Icon[path];
			fncb(path, db[0], db[1]);
		}
	},

	SetStyle: function () {
		Sync.PathIcon.fStyle = LVIS_CUT;
	}
};

AddEvent("HandleIcon", function (Ctrl, pid, iItem) {
	if (Ctrl.hwndList && pid) {
		const i = Ctrl.IconSize < 32 ? 0 : 1, db = Sync.PathIcon.Icon[api.GetDisplayNameOf(pid, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING).toLowerCase()];
		if (db) {
			if (db[i]) {
				if (db[i + 2]) {
					return true;
				}
				const image = Sync.PathIcon.GetIconImage(db[i], i);
				if (image) {
					db[i + 2] = GetThumbnail(image, [32, 256][i] * screen.deviceYDPI / 96, true) || 1;
					return true;
				}
			}
		}
	}
}, true);

AddEvent("ItemPostPaint", function (Ctrl, pid, nmcd, vcd) {
	const db = Sync.PathIcon.Icon[api.GetDisplayNameOf(pid, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING).toLowerCase()];
	if (db) {
		const hList = Ctrl.hwndList;
		if (hList) {
			let image = db[Ctrl.IconSize < 32 ? 2 : 3];
			if (/object/i.test(typeof image)) {
				let cl, fStyle, rc = api.Memory("RECT");
				rc.Left = LVIR_ICON;
				api.SendMessage(hList, LVM_GETITEMRECT, nmcd.dwItemSpec, rc);
				const state = api.SendMessage(hList, LVM_GETITEMSTATE, nmcd.dwItemSpec, Sync.PathIcon.fStyle);
				if (state == LVIS_SELECTED) {
					cl = CLR_DEFAULT;
					fStyle = api.GetFocus() == hList ? ILD_SELECTED : ILD_FOCUS;
				} else {
					cl = CLR_NONE;
					fStyle = (state & LVIS_CUT) || api.GetAttributesOf(pid, SFGAO_HIDDEN) ? ILD_SELECTED : ILD_NORMAL;
				}
				image = GetThumbnail(image, Ctrl.IconSize * screen.deviceYDPI / 96, Ctrl.IconSize >= 32);
				image.DrawEx(nmcd.hdc, rc.Left + (rc.Right - rc.Left - image.GetWidth()) / 2, rc.Top + (rc.Bottom - rc.Top - image.GetHeight()) / 2, 0, 0, cl, cl, fStyle);
				return S_OK;
			}
			return;
		}
		const hTree = Ctrl.hwndTree;
		if (hTree) {
			let image = db[2], cx = api.GetSystemMetrics(SM_CYSMICON) * screen.deviceYDPI / 96;
			if (!image) {
				if (image === 1) {
					return;
				}
				image = GetThumbnail(Sync.PathIcon.GetIconImage(db[0]), cx, true) || 1;
				db[2] = image;
			}
			if (/object/i.test(typeof image)) {
				const rc = api.Memory("RECT");
				rc.Write(0, VT_I8, nmcd.dwItemSpec);
				if (api.SendMessage(hTree, TVM_GETITEMRECT, true, rc)) {
					const x = rc.Left - cx - 3 * screen.deviceYDPI / 96;
					const w = image.GetWidth();
					let h = image.GetHeight();
					const y = rc.Top + (rc.Bottom - rc.Top - h) / 2;
					rc.left = x;
					rc.right = x + w;
					let n = h;
					let cl = api.GetPixel(nmcd.hdc, x + w, y + h);
					while (h-- > 0) {
						const cl1 = api.GetPixel(nmcd.hdc, x + w, y + h);
						if (cl == cl1 && h) {
							continue;
						}
						const brush = api.CreateSolidBrush(cl1);
						rc.top = y + h;
						rc.bottom = y + n;
						api.FillRect(nmcd.hdc, rc, brush);
						api.DeleteObject(brush);
						cl = cl1;
						n = h;
					}
					image.DrawEx(nmcd.hdc, x, y, 0, 0, CLR_NONE, CLR_NONE, ILD_NORMAL);
					return S_OK;
				}
			}
		}
	}
}, true);

AddEvent("GetIconImage", function (Ctrl, clBk) {
	const db = Sync.PathIcon.Icon[(api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING) || "").toLowerCase()];
	if (db && db[0]) {
		return MakeImgSrc(db[0], 0, false, 16, clBk);
	}
});

AddEvent("SaveConfig", function () {
	if (Sync.PathIcon.bSave) {
		try {
			const ado = api.CreateObject("ads");
			ado.CharSet = "utf-8";
			ado.Open();
			Sync.PathIcon.ENumCB(function (path, s, l) {
				ado.WriteText([path, s, l].join("\t") + "\r\n");
			});
			ado.SaveToFile(Sync.PathIcon.CONFIG, adSaveCreateOverWrite);
			ado.Close();
			Sync.PathIcon.bSave = false;
		} catch (e) { }
	}
});

try {
	const ado = OpenAdodbFromTextFile(Sync.PathIcon.CONFIG);
	if (ado) {
		while (!ado.EOS) {
			const ar = ado.ReadText(adReadLine).split("\t");
			if (ar[0]) {
				let s = ExtractPath(te, ar[0]).toLowerCase();
				if (s) {
					if (/^shell:|^::{/i.test(s)) {
						s = api.ILCreateFromPath(s);
						s.IsFileSystem;
						s = api.GetDisplayNameOf(s, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING).toLowerCase();
					}
					const db = {};
					Sync.PathIcon.Icon[s] = db;
					for (let j = 2; j--;) {
						if (ar[j + 1]) {
							db[j] = ar[j + 1];
						}
					}
				}
			}
		}
		ado.Close();
	}
} catch (e) { }
