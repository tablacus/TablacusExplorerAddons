Sync.ExtensionIcon = {
	Icon: {},
	fStyle: LVIS_CUT | LVIS_SELECTED,

	GetIconImage: function (fn, Large) {
		fn = api.PathUnquoteSpaces(ExtractMacro(te, fn));
		return api.CreateObject("WICBitmap").FromFile(fn) || MakeImgData(fn, 0, Large ? 48 : 16);
	}
};

AddEvent("HandleIcon", function (Ctrl, pid) {
	if (Ctrl.hwndList) {
		let db, i = Ctrl.IconSize < 32 ? 0 : 1;
		if (db = Sync.ExtensionIcon.Icon[fso.GetExtensionName(api.GetDisplayNameOf(pid, SHGDN_FORPARSING)).toLowerCase()]) {
			const wfd = api.Memory("WIN32_FIND_DATA");
			const hr = api.SHGetDataFromIDList(pid, SHGDFIL_FINDDATA, wfd, wfd.Size);
			if (hr < 0 || !(wfd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY)) {
				let image = db[i];
				if (image) {
					if (/string/i.test(typeof image)) {
						image = Sync.ExtensionIcon.GetIconImage(image, i);
						if (image) {
							db[i] = GetThumbnail(image, [32, 256][i] * screen.deviceYDPI / 96, true);
							return true;
						}
					} else {
						return true;
					}
				}
			}
		}
	}
});

AddEvent("ItemPostPaint", function (Ctrl, pid, nmcd, vcd) {
	const hList = Ctrl.hwndList;
	if (hList) {
		const db = Sync.ExtensionIcon.Icon[fso.GetExtensionName(api.GetDisplayNameOf(pid, SHGDN_FORPARSING)).toLowerCase()];
		if (db) {
			const wfd = api.Memory("WIN32_FIND_DATA");
			const hr = api.SHGetDataFromIDList(pid, SHGDFIL_FINDDATA, wfd, wfd.Size);
			if (hr < 0 || !(wfd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY)) {
				let image = db[Ctrl.IconSize < 32 ? 0 : 1];
				if (/object/i.test(typeof image)) {
					let cl, fStyle, rc = api.Memory("RECT");
					rc.left = LVIR_ICON;
					api.SendMessage(hList, LVM_GETITEMRECT, nmcd.dwItemSpec, rc);
					let state = api.SendMessage(hList, LVM_GETITEMSTATE, nmcd.dwItemSpec, Sync.ExtensionIcon.fStyle);
					if (state == LVIS_SELECTED) {
						cl = CLR_DEFAULT;
						fStyle = api.GetFocus() == hList ? ILD_SELECTED : ILD_FOCUS;
					} else {
						cl = CLR_NONE;
						fStyle = (state & LVIS_CUT) || api.GetAttributesOf(pid, SFGAO_HIDDEN) ? ILD_SELECTED : ILD_NORMAL;
					}
					image = GetThumbnail(image, Ctrl.IconSize * screen.deviceYDPI / 96, Ctrl.IconSize >= 32);
					if (Ctrl.CurrentViewMode == FVM_SMALLICON) {
						rc.left = rc.right - image.GetWidth();
					}
					image.DrawEx(nmcd.hdc, rc.left + (rc.right - rc.left - image.GetWidth()) / 2, rc.top + (rc.bottom - rc.top - image.GetHeight()) / 2, 0, 0, cl, cl, fStyle);
					return S_OK;
				}
			}
		}
	}
});

try {
	const ado = OpenAdodbFromTextFile(BuildPath(te.Data.DataFolder, "config\\extensionicon.tsv"), "utf-8");
	while (!ado.EOS) {
		const ar = ado.ReadText(adReadLine).split("\t");
		if (ar[0]) {
			const a2 = ar[0].toLowerCase().split(/[^\w_!~#$%&\(\)]/);
			for (let i in a2) {
				if (a2[i]) {
					const db = {};
					Sync.ExtensionIcon.Icon[a2[i]] = db;
					for (let j = 2; j--;) {
						if (ar[j + 1]) {
							db[j] = ar[j + 1];
						}
					}
				}
			}
		}
	}
	ado.Close();
} catch (e) { }
