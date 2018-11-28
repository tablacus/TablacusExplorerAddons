var Addon_Id = "virtualname";

var item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "Context");
	item.setAttribute("MenuPos", 1);

	item.setAttribute("KeyOn", "List");
	item.setAttribute("MouseOn", "List");
}

if (window.Addon == 1) {
	Addons.VirtualName =
	{
		CONFIG: fso.BuildPath(te.Data.DataFolder, "config\\virtualname.tsv"),
		bSave: false,
		Filter: item.getAttribute("Filter") || "*",
		Portable: api.LowPart(item.getAttribute("Portable")),
		SyncItem: {},

		Get: function (path)
		{
			if (!/string/i.test(typeof path)) {
				var path = api.GetDisplayNameOf(path, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL) || "";
			}
			return te.Data.VirtualName && te.Data.VirtualName[path] || "";
		},

		Set: function (path, name)
		{
			if (path) {
				if (!/string/i.test(typeof path)) {
					var path = api.GetDisplayNameOf(path, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL) || "";
				}
				if (name !== te.Data.VirtualName[path]) {
					if (name) {
						te.Data.VirtualName[path] = name;
					} else {
						delete te.Data.VirtualName[path];
					}
					Addons.VirtualName.bSave = true;
				}
			}
		},

		Exec: function (Ctrl, pt)
		{
			var Selected = GetSelectedArray(Ctrl, pt, true).shift();
			if (Selected && Selected.Count) {
				var path = api.GetDisplayNameOf(Selected.Item(0), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL) || "";
				var n = Addons.VirtualName.Get(path);
				var s = InputDialog(Selected.Item(0).Path + "\n" + n, n);
				if (/string/i.test(typeof s)) {
					Addons.VirtualName.Set(path, s);;
				}
			}
			return S_OK;
		},

		ENumCB: function (fncb)
		{
			for (var path in te.Data.VirtualName) {
				fncb(path, te.Data.VirtualName[path]);
			}
		},

		SetFilters: function (s)
		{
			var cFV = te.Ctrls(CTRL_FV);
			for (var i in cFV) {
				ColumnsReplace(cFV[i], "Name", HDF_LEFT, Addons.VirtualName.ReplaceColumns);
			}
		},

		ReplaceColumns: function (FV, pid, s)
		{
			return Addons.VirtualName.Get(pid);
		},

		SetSync: function (name, s)
		{
			this.SyncItem[name] = s;
			clearTimeout(this.tidSync);
			this.tidSync = setTimeout(function ()
			{
				Addons.VirtualName.tidSync = null;
				Addons.VirtualName.SyncItem = {};
			}, 500);
		}
	}

	AddEvent("Load", function ()
	{
		te.Data.VirtualName = api.CreateObject("Object");
		try {
			var ado = api.CreateObject("ads");
			ado.CharSet = "utf-8";
			ado.Open();
			ado.LoadFromFile(Addons.VirtualName.CONFIG);
			while (!ado.EOS) {
				var ar = ado.ReadText(adReadLine).split("\t");
				te.Data.VirtualName[ar[0]] = ar[1];
			}
			ado.Close();
			delete te.Data.VirtualName[""];
		} catch (e) {}

		AddEvent("SaveConfig", function ()
		{
			if (Addons.VirtualName.bSave) {
				try {
					var ado = api.CreateObject("ads");
					ado.CharSet = "utf-8";
					ado.Open();
					delete te.Data.VirtualName[""];
					Addons.VirtualName.ENumCB(function (path, name)
					{
						ado.WriteText([path, name].join("\t") + "\r\n");
					});
					ado.SaveToFile(Addons.VirtualName.CONFIG, adSaveCreateOverWrite);
					ado.Close();
					Addons.VirtualName.bSave = false;
				} catch (e) {}
			}
		});

		var Installed0 = (Addons.VirtualName.Get('%Installed%') || "").toUpperCase();
		var Installed1 = Addons.VirtualName.Portable ? fso.GetDriveName(api.GetModuleFileName(null)).toUpperCase() : "";
		if (Installed0 && Addons.VirtualName.Portable && Installed0 != Installed1) {
			Addons.VirtualName.ENumCB(function (path, value)
			{
				var drv = fso.GetDriveName(path);
				if (drv.toUpperCase() == Installed0) {
					Addons.VirtualName.Set(path);
					Addons.VirtualName.Set(Installed1 + path.substr(drv.length), value);
				}
			});
		}
		if (Addons.VirtualName.Portable || Installed0) {
			Addons.VirtualName.Set('%Installed%', Installed1);
		}
		Addons.VirtualName.SetFilters();
	});

	AddEvent("ChangeNotify", function (Ctrl, pidls)
	{
		if (te.Data.VirtualName) {
			if (pidls.lEvent & (SHCNE_RENAMEFOLDER | SHCNE_RENAMEITEM)) {
				var name = fso.GetFileName(api.GetDisplayNameOf(pidls[0], SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL));
				var s = Addons.VirtualName.Get(pidls[0]);
				if (s) {
					Addons.VirtualName.SetSync(name, s);
				} else {
					name = fso.GetFileName(api.GetDisplayNameOf(pidls[1], SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL));
					s = Addons.VirtualName.SyncItem[name];
				}
				if (s) {
					Addons.VirtualName.Set(pidls[1], s);
				}
				Addons.VirtualName.Set(pidls[0], "");
			}
			if (pidls.lEvent & SHCNE_DELETE) {
				var name = fso.GetFileName(api.GetDisplayNameOf(pidls[0], SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL));
				Addons.VirtualName.SetSync(name, Addons.VirtualName.Get(pidls[0]));
				Addons.VirtualName.Set(pidls[0], "");
			}
			if (pidls.lEvent & SHCNE_CREATE) {
				var name = fso.GetFileName(api.GetDisplayNameOf(pidls[0], SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL));
				var Item = Addons.VirtualName.SyncItem[name];
				if (Item) {
					Addons.VirtualName.Set(pidls[0], Item);
				}
			}
		}
	});

	AddEvent("ViewCreated", function (Ctrl)
	{
		if (Ctrl.FolderItem && PathMatchEx(Ctrl.FolderItem.Path, Addons.VirtualName.Filter)) {
			ColumnsReplace(Ctrl, "Name", HDF_LEFT, Addons.VirtualName.ReplaceColumns);
		}
	});

	Addons.VirtualName.strName = item.getAttribute("MenuName");
	if (!Addons.VirtualName.strName) {
		var info = GetAddonInfo(Addon_Id);
		Addons.VirtualName.strName = info.Name;
	}

	//Menu
	if (item.getAttribute("MenuExec")) {
		Addons.VirtualName.nPos = api.LowPart(item.getAttribute("MenuPos"));
		var s = item.getAttribute("MenuName");
		if (s && s != "") {
			Addons.VirtualName.strName = s;
		}
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
		{
			api.InsertMenu(hMenu, Addons.VirtualName.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Addons.VirtualName.strName));
			ExtraMenuCommand[nPos] = Addons.VirtualName.Exec;
			return nPos;
		});
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.VirtualName.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.VirtualName.Exec, "Func");
	}

	AddTypeEx("Add-ons", "Virtual name", Addons.VirtualName.Exec);
} else {
	SetTabContents(0, "General", '<label>Filter</label><input type="text" name="Filter" style="width: 100%" /><input type="checkbox" id="Portable" /><label for="Portable">Portable</label>');
}