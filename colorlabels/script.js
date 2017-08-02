var Addon_Id = "colorlabels";

var item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "Context");
	item.setAttribute("MenuPos", 1);

	item.setAttribute("KeyOn", "List");
	item.setAttribute("MouseOn", "List");
}

if (window.Addon == 1) {
	Addons.ColorLabels =
	{
		CONFIG: fso.BuildPath(te.Data.DataFolder, "config\\colorlabels.tsv"),
		bSave: false,
		Portable: api.LowPart(item.getAttribute("Portable")),

		Get: function (path)
		{
			if (!/string/i.test(typeof path)) {
				path = api.GetDisplayNameOf(path, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
			}
			return te.Data.ColorLabels && te.Data.ColorLabels[path.toLowerCase()];
		},

		Exec: function (Ctrl, pt)
		{
			var Selected = GetSelectedArray(Ctrl, pt, true).shift();
			if (Selected && Selected.Count) {
				var cl = ChooseColor(Addons.ColorLabels.Get(Selected.Item(0)));
				for (var i = Selected.Count; i--;) {
					Addons.ColorLabels.Set(Selected.Item(i), cl);
				}
			}
			return S_OK;
		},

		Set: function (path, cl)
		{
			if (path) {
				if (!/string/i.test(typeof path)) {
					path = api.GetDisplayNameOf(path, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING);
				}
				path = path.toLowerCase();
				if (cl !== te.Data.ColorLabels[path]) {
					if (s !== undefined) {
						te.Data.ColorLabels[path] = cl;
					} else {
						delete te.Data.ColorLabels[path];
					}
					Addons.ColorLabels.bSave = true;
				}
			}
		},

		ENumCB: function (fncb)
		{
			for (var path in te.Data.ColorLabels) {
				fncb(path, te.Data.ColorLabels[path]);
			}
		}
	}

	AddEvent("Load", function ()
	{
		te.Data.ColorLabels = te.Object();
		try {
			var ado = te.CreateObject("Adodb.Stream");
			ado.CharSet = "utf-8";
			ado.Open();
			ado.LoadFromFile(Addons.ColorLabels.CONFIG);
			while (!ado.EOS) {
				var ar = ado.ReadText(adReadLine).split("\t");
				te.Data.ColorLabels[ar[0]] = GetWinColor(ar[1]);
			}
			ado.Close();
			delete te.Data.ColorLabels[""];
		} catch (e) {}

		AddEvent("SaveConfig", function ()
		{
			if (Addons.ColorLabels.bSave) {
				try {
					var ado = te.CreateObject("Adodb.Stream");
					ado.CharSet = "utf-8";
					ado.Open();
					delete te.Data.ColorLabels[""];
					Addons.ColorLabels.ENumCB(function (path, cl)
					{
						ado.WriteText([path, GetWebColor(cl)].join("\t") + "\r\n");
					});
					ado.SaveToFile(Addons.ColorLabels.CONFIG, adSaveCreateOverWrite);
					ado.Close();
					Addons.ColorLabels.bSave = false;
				} catch (e) {}
			}
		});

		var Installed0 = (Addons.ColorLabels.Get('%Installed%') || "").toUpperCase();
		var Installed1 = Addons.ColorLabels.Portable ? fso.GetDriveName(api.GetModuleFileName(null)).toUpperCase() : "";
		if (Installed0 && Addons.ColorLabels.Portable && Installed0 != Installed1) {
			Addons.ColorLabels.ENumCB(function (path, value)
			{
				var drv = fso.GetDriveName(path);
				if (drv.toUpperCase() == Installed0) {
					Addons.ColorLabels.Set(path, "");
					Addons.ColorLabels.Set(Installed1 + path.substr(drv.length), value);
				}
			});
		}
		if (Addons.ColorLabels.Portable || Installed0) {
			Addons.ColorLabels.Set('%Installed%', Installed1);
		}
	});

	AddEvent("ItemPrePaint2", function (Ctrl, pid, nmcd, vcd, plRes)
	{
		if (pid) {
			var cl = Addons.ColorLabels.Get(pid);
			if (cl !== undefined) {
				vcd.clrTextBk = cl;
				var brush = api.CreateSolidBrush(cl);
				api.FillRect(nmcd.hdc, nmcd.rc, brush);
				api.DeleteObject(brush);
				if (vcd.clrText == GetSysColor(COLOR_WINDOWTEXT)) {
					cl = (cl & 0xff) * 299 + (cl & 0xff00) * 2.29296875 + (cl &0xff0000) * 0.001739501953125;
					vcd.clrText = cl > 127000 ? 0 : 0xffffff;
				}
			}
		}
	});

	Addons.ColorLabels.strName = item.getAttribute("MenuName");
	if (!Addons.ColorLabels.strName) {
		var info = GetAddonInfo(Addon_Id);
		Addons.ColorLabels.strName = info.Name;
	}

	//Menu
	if (item.getAttribute("MenuExec")) {
		Addons.ColorLabels.nPos = api.LowPart(item.getAttribute("MenuPos"));
		var s = item.getAttribute("MenuName");
		if (s && s != "") {
			Addons.ColorLabels.strName = s;
		}
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
		{
			api.InsertMenu(hMenu, Addons.ColorLabels.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Addons.ColorLabels.strName));
			ExtraMenuCommand[nPos] = Addons.ColorLabels.Exec;
			return nPos;
		});
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.ColorLabels.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.ColorLabels.Exec, "Func");
	}

	AddTypeEx("Add-ons", "Color labels", Addons.ColorLabels.Exec);
} else {
	SetTabContents(0, "General", '<input type="checkbox" id="Portable" /><label for="Portable">Portable</label>');
}