var Addon_Id = "pathicon";

var item = GetAddonElement(Addon_Id);
Addons.PathIcon = {
	Icon: {},
	fStyle: LVIS_CUT | LVIS_SELECTED,
	CONFIG: fso.BuildPath(te.Data.DataFolder, "config\\pathicon.tsv"),

	GetIconImage: function (fn, Large)
	{
		fn = api.PathUnquoteSpaces(ExtractMacro(te, fn));
		return te.WICBitmap().FromFile(fn) || MakeImgData(fn, 0, Large ? 48 : 16);
	},

	Exec: function (Ctrl, pt)
	{
		AddonOptions("pathicon", function ()
		{
		}, { FV: GetFolderView(Ctrl, pt) });
	},

	Replace: function (path, s, l)
	{
		path = path.toLowerCase();
		var db = Addons.PathIcon.Icon[path];
		if (!db) {
			db = Addons.PathIcon.Icon[path] = {};
		}
		if (s) {
			Addons.PathIcon.bSave |= db[0] != s;
			db[0] = s;
			delete db[2];
		}
		if (l) {
			Addons.PathIcon.bSave |= db[1] != l;
			db[1] = l;
			delete db[3];
		}
		api.RedrawWindow(te.hwnd, null, 0, RDW_INVALIDATE | RDW_FRAME | RDW_ALLCHILDREN);
	},

	Remove: function (path, mode)
	{
		path = path.toLowerCase();
		var db = Addons.PathIcon.Icon[path];
		if (db) {
			mode = api.LowPart(mode);
			if (mode != 0) {
				Addons.PathIcon.bSave |= db[1] != "";
				delete db[1];
				delete db[3];
			}
			if (mode != 1) {
				Addons.PathIcon.bSave |= db[0] != "";
				delete db[0];
				delete db[2];
			}
			if (!db[0] && !db[1]) {
				delete Addons.PathIcon.Icon[path];
			}
			api.RedrawWindow(te.hwnd, null, 0, RDW_INVALIDATE | RDW_FRAME | RDW_ALLCHILDREN);
		}
	},

	ENumCB: function (fncb)
	{
		for (var path in Addons.PathIcon.Icon) {
			var db = Addons.PathIcon.Icon[path];
			fncb(path, db[0], db[1]);
		}
	}
};

if (window.Addon == 1) {
	AddEvent("HandleIcon", function (Ctrl, pid)
	{
		if (Ctrl.hwndList && pid) {
			var i = Ctrl.IconSize < 32 ? 0 : 1, db = Addons.PathIcon.Icon[api.GetDisplayNameOf(pid, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL).toLowerCase()];
			if (db) {
				if (db[i]) {
					if (db[i + 2]) {
						return true;
					}
					var image = Addons.PathIcon.GetIconImage(db[i], i);
					if (image) {
						db[i + 2] = GetThumbnail(image, [32, 256][i] * screen.logicalYDPI / 96, true) || 1;
						return true;
					}
				}
			}
		}
	}, true);

	AddEvent("ItemPostPaint", function (Ctrl, pid, nmcd, vcd)
	{
		var db = Addons.PathIcon.Icon[api.GetDisplayNameOf(pid, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL).toLowerCase()];
		if (db) {
			var hList = Ctrl.hwndList;
			if (hList) {
				var image = db[Ctrl.IconSize < 32 ? 2 : 3];
				if (/object/i.test(typeof image)) {
					var cl, fStyle, rc = api.Memory("RECT");
					rc.Left = LVIR_ICON;
					api.SendMessage(hList, LVM_GETITEMRECT, nmcd.dwItemSpec, rc);
					var state = api.SendMessage(hList, LVM_GETITEMSTATE, nmcd.dwItemSpec, Addons.PathIcon.fStyle);
					if (state == LVIS_SELECTED) {
						cl = CLR_DEFAULT;
						fStyle = api.GetFocus() == hList ? ILD_SELECTED : ILD_FOCUS;
					} else {
						cl = CLR_NONE;
						fStyle = (state & LVIS_CUT) || api.GetAttributesOf(pid, SFGAO_HIDDEN) ? ILD_SELECTED : ILD_NORMAL;
					}
					image = GetThumbnail(image, Ctrl.IconSize * screen.logicalYDPI / 96, Ctrl.IconSize >= 32);
					image.DrawEx(nmcd.hdc, rc.Left + (rc.Right - rc.Left - image.GetWidth()) / 2, rc.Top + (rc.Bottom - rc.Top - image.GetHeight()) / 2, 0, 0, cl, cl, fStyle);
					return S_OK;
				}
				return;
			}
			var hTree = Ctrl.hwndTree;
			if (hTree) {
				var image = db[2], cx = api.GetSystemMetrics(SM_CYSMICON) * screen.logicalYDPI / 96;
				if (!image) {
					if (image === 1) {
						return;
					}
					image = GetThumbnail(Addons.PathIcon.GetIconImage(db[0]), cx, true) || 1;
					db[i + 2] = image;
				}
				if (/object/i.test(typeof image)) {
					var rc = api.Memory("RECT");
					rc.Left = nmcd.dwItemSpec;
					api.SendMessage(hTree, TVM_GETITEMRECT, true, rc);
					image.DrawEx(nmcd.hdc, rc.Left - cx - 3 * screen.logicalYDPI / 96, rc.Top + (rc.Bottom - rc.Top - image.GetHeight()) / 2, 0, 0, GetSysColor(COLOR_WINDOW), CLR_NONE, ILD_NORMAL);
				}
			}
		}
	}, true);

	AddEvent("GetIconImage", function (Ctrl, BGColor)
	{
		var db = Addons.PathIcon.Icon[(api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL) || "").toLowerCase()];
		if (db && db[0]) {
			return MakeImgSrc(db[0], 0, false, 16);
		}
	});

	AddEvent("SaveConfig", function ()
	{
		if (Addons.PathIcon.bSave) {
			try {
				var ado = new ActiveXObject(api.ADBSTRM);
				ado.CharSet = "utf-8";
				ado.Open();
				Addons.PathIcon.ENumCB(function (path, s, l)
				{
					ado.WriteText([path, s, l].join("\t") + "\r\n");
				});
				ado.SaveToFile(Addons.PathIcon.CONFIG, adSaveCreateOverWrite);
				ado.Close();
				Addons.PathIcon.bSave = false;
			} catch (e) {}
		}
	});

	Addons.PathIcon.strName = item.getAttribute("MenuName") || GetText(GetAddonInfo(Addon_Id).Name);
	//Menu
	if (item.getAttribute("MenuExec")) {
		Addons.PathIcon.nPos = api.LowPart(item.getAttribute("MenuPos"));
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
		{
			api.InsertMenu(hMenu, Addons.PathIcon.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Addons.PathIcon.strName);
			ExtraMenuCommand[nPos] = Addons.PathIcon.Exec;
			return nPos;
		});
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.PathIcon.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.PathIcon.Exec, "Func");
	}
	//Type
	AddTypeEx("Add-ons", "Path icon", Addons.PathIcon.Exec);

	try {
		var ado = OpenAdodbFromTextFile(Addons.PathIcon.CONFIG);
		if (ado) {
			while (!ado.EOS) {
				var ar = ado.ReadText(adReadLine).split("\t");
				if (ar[0]) {
					var s = api.PathUnquoteSpaces(ExtractMacro(te, ar[0])).toLowerCase();
					if (s) {
						if (/^shell:|^::{/.test(s)) {
							s = api.ILCreateFromPath(s);
							s.IsFileSystem; 
							s = api.GetDisplayNameOf(s, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL).toLowerCase();
						}
						var db = {};
						Addons.PathIcon.Icon[s] = db;
						for (var j = 2; j--;) {
							if (ar[j + 1]) {
								db[j] = ar[j + 1];
							}
						}
					}
				}
			}
			ado.Close();
		}
	} catch (e) {}

	if (api.IsAppThemed() && WINVER >= 0x600) {
		AddEvent("Load", function ()
		{
			if (!Addons.ClassicStyle) {
				Addons.PathIcon.fStyle = LVIS_CUT;
			}
		});
	}
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}