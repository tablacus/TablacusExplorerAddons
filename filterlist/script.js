var Addon_Id = "filterlist";

if (window.Addon == 1) {
	Addons.FilterList = {
		Menus: [],

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
				api.InsertMenu(hMenu, 0, MF_BYPOSITION | MF_STRING, i + 1, Addons.FilterList.Menus[i]);
			}
			var Verb = api.TrackPopupMenuEx(hMenu, fuFlags, pt.x, pt.y, te.hwnd, null, null);
			api.DestroyMenu(hMenu);
			if (Verb) {
				var ar = Addons.FilterList.Menus[Verb - 1].split("\t");
				FV.FilterView = ar[1];
				FV.Refresh();
			}
			return S_OK;
		}
	};
	try {
		var ado = te.CreateObject("Adodb.Stream");
		ado.CharSet = "utf-8";
		ado.Open();
		ado.LoadFromFile(fso.BuildPath(te.Data.DataFolder, "config\\" + Addon_Id + ".tsv"));
		while (!ado.EOS) {
			Addons.FilterList.Menus.push(ado.ReadText(adReadLine));
		}
		ado.Close();
	} catch (e) {}

}
