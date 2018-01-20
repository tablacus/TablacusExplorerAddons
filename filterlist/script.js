var Addon_Id = "filterlist";

var item = GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.FilterList = {
		Menus: [],
		Name: api.LowPart(item.getAttribute("Name")),
		Filter: api.LowPart(item.getAttribute("Filter")),

		Exec: function (Ctrl, pt, Id)
		{
			var o;
			var FV = GetFolderView(Ctrl, pt);
			if (!FV) {
				return S_OK;
			}
			var fuFlags = TPM_RIGHTBUTTON | TPM_RETURNCMD;
			if (Ctrl && !Ctrl.Type) {
				o = Ctrl;
				pt = GetPos(o, true);
				if (pt.x || pt.y) {
					fuFlags |= TPM_RIGHTALIGN;
					pt.x += o.offsetWidth * screen.deviceXDPI / screen.logicalXDPI;
					pt.y += o.offsetHeight * screen.deviceYDPI / screen.logicalYDPI;
				}
			}
			if (!pt) {
				pt = api.Memory("POINT");
			}
			if (!pt.x && !pt.y) {
				api.GetCursorPos(pt);
			}
			if (o && isFinite(Id)) {
				Activate(o, Id);
			}
			var hMenu = api.CreatePopupMenu();
			for (var i = Addons.FilterList.Menus.length; i--;) {
				var ar = Addons.FilterList.Menus[i].split("\t");
				if (Addons.FilterList.Name) {
					if (!Addons.FilterList.Filter && ar[0]) {
						ar.splice(1, 1);
					}
				} else if (Addons.FilterList.Filter && ar[1]) {
					ar.splice(0, 1);
				}
				api.InsertMenu(hMenu, 0, MF_BYPOSITION | MF_STRING, i + 1, ar.join("\t"));
			}
			var Verb = api.TrackPopupMenuEx(hMenu, fuFlags, pt.x, pt.y, te.hwnd, null, null);
			api.DestroyMenu(hMenu);
			if (Verb) {
				var ar = Addons.FilterList.Menus[Verb - 1].split("\t");
				var s = ar[1];
				if (!/^\//.test(s)) {
					var ar = s.split(/;/);
					for (var i in ar) {
						var res = /^([^\*\?]+)$/.exec(ar[i]); 
						if (res) {
							ar[i] = "*" + res[1] + "*";
						}
					}
					s = ar.join(";");
				}
				FV.FilterView = s || null;
				FV.Refresh();
			}
			return S_OK;
		}
	};
	try {
		var ado = te.CreateObject(api.ADBSTRM);
		ado.CharSet = "utf-8";
		ado.Open();
		ado.LoadFromFile(fso.BuildPath(te.Data.DataFolder, "config\\" + Addon_Id + ".tsv"));
		while (!ado.EOS) {
			Addons.FilterList.Menus.push(ado.ReadText(adReadLine));
		}
		ado.Close();
	} catch (e) {}
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
