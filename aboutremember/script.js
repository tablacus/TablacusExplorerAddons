var Addon_Id = "aboutremember";
var item = GetAddonElement(Addon_Id);

if (window.Addon == 1) {
	Addons.AboutRemember =
	{
		PATH: "about:remember",
		CONFIG: fso.BuildPath(te.Data.DataFolder, "config\\speeddial.tsv"),

		IsHandle: function (Ctrl)
		{
			return String(typeof(Ctrl) == "string" ? Ctrl : api.GetDisplayNameOf(Ctrl, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING)).toLowerCase() == Addons.AboutRemember.PATH;
		},

		Edit: function (Ctrl, pt)
		{
			if (!Addons.AboutRemember || !Addons.AboutRemember.IsHandle(Ctrl)) {
				return;
			}
			var Selected = GetSelectedArray(Ctrl, pt, true).shift();
			if (Selected && Selected.Count) {
				var path1 = api.GetDisplayNameOf(Selected.Item(0), SHGDN_FORPARSING | SHGDN_FORADDRESSBAR | SHGDN_ORIGINAL);
				var path = te.Data.AddonsData.AboutRemember[path1];
				ShowDialog("../addons/aboutremember/dialog.html", { MainWindow: MainWindow, path: path, width: 640, height: 360 });
			}
		},

		Remove: function (Ctrl, pt)
		{
			if (!Addons.AboutRemember || !Addons.AboutRemember.IsHandle(Ctrl) || !confirmOk("Are you sure?")) {
				return;
			}
			var ar = GetSelectedArray(Ctrl, pt, true);
			var Selected = ar[0];
			var FV = ar[2];
			FV.Parent.LockUpdate();
			for (var j = Selected.Count; j--;) {
				var Item = Selected.Item(j);
				FV.RemoveItem(Item);
				var path1 = api.GetDisplayNameOf(Item, SHGDN_FORPARSING | SHGDN_FORADDRESSBAR | SHGDN_ORIGINAL);
				var path = te.Data.AddonsData.AboutRemember[path1];
				delete Addons.Remember.db[path];
				delete te.Data.AddonsData.AboutRemember[path1];
			}
			FV.Parent.UnlockUpdate();
		},
	}

	AddEvent("TranslatePath", function (Ctrl, Path)
	{
		if (Addons.AboutRemember.IsHandle(Path)) {
			if (Addons.Remember) {
				Ctrl.Enum = function (pid, Ctrl, fncb)
				{
					te.Data.AddonsData.AboutRemember = api.CreateObject("Object");
					var Items = api.CreateObject("FolderItems");
					for (var path in Addons.Remember.db) {
						var ar = Addons.Remember.db[path];
						var Item = /^([1-9]+\d*)$/.test(path) ? api.ILCreateFromPath(path) : api.SHSimpleIDListFromPath(path, FILE_ATTRIBUTE_DIRECTORY, new Date(ar[0] - 0), 0);
						Item.IsFolder;
						Items.AddItem(Item);
						te.Data.AddonsData.AboutRemember[api.GetDisplayNameOf(Item, SHGDN_FORPARSING | SHGDN_FORADDRESSBAR | SHGDN_ORIGINAL)] = path;
					}
					return Items;
				};
			}
			return ssfRESULTSFOLDER;
		}
	}, true);

	AddEvent("GetTabName", function (Ctrl)
	{
		if (Addons.AboutRemember.IsHandle(Ctrl)) {
			return GetText("Remember");
		}
	}, true);

	AddEvent("GetIconImage", function (Ctrl, BGColor, bSimple)
	{
		if (Addons.AboutRemember.IsHandle(Ctrl)) {
			return MakeImgDataEx("folder:closed", bSimple, 16);
		}
	});

	AddEvent("Context", function (Ctrl, hMenu, nPos, Selected, item, ContextMenu)
	{
		if (Addons.AboutRemember.IsHandle(Ctrl)) {
			RemoveCommand(hMenu, ContextMenu, "delete;rename");
			if (te.Data.AddonsData.AboutRemember) {
				api.InsertMenu(hMenu, -1, MF_BYPOSITION | MF_STRING, ++nPos, GetText("Edit"));
				ExtraMenuCommand[nPos] = Addons.AboutRemember.Edit;
				api.InsertMenu(hMenu, -1, MF_BYPOSITION | MF_STRING, ++nPos, GetText("Remove"));
				ExtraMenuCommand[nPos] = Addons.AboutRemember.Remove;
			}
		}
		return nPos;
	});

	AddEvent("BeginLabelEdit", function (Ctrl, Name)
	{
		if (Ctrl.Type <= CTRL_EB) {
			if (Addons.AboutRemember.IsHandle(Ctrl)) {
				return 1;
			}
		}
	});
	AddEvent("Command", function (Ctrl, hwnd, msg, wParam, lParam)
	{
		if (Ctrl.Type == CTRL_SB || Ctrl.Type == CTRL_EB) {
			if (Addons.AboutRemember.IsHandle(Ctrl)) {
				if ((wParam & 0xfff) == CommandID_DELETE - 1) {
					Addons.AboutRemember.Remove(Ctrl);
					return S_OK;
				}
			}
		}
	}, true);

	AddEvent("InvokeCommand", function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon)
	{
		if (Verb == CommandID_DELETE - 1) {
			var FV = ContextMenu.FolderView;
			if (FV && Addons.AboutRemember.IsHandle(FV)) {
				return S_OK;
			}
		}
		if (!Verb) {
			if (ContextMenu.Items.Count >= 1) {
				var path = api.GetDisplayNameOf(ContextMenu.Items.Item(0), SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_ORIGINAL);
				if (Addons.AboutRemember.IsHandle(path)) {
					var FV = te.Ctrl(CTRL_FV);
					FV.Navigate(path, SBSP_SAMEBROWSER);
					return S_OK;
				}
			}
		}
	}, true);

	if (item.getAttribute("AddToMenu")) {
		AddEvent("AddItems", function (Items, pid)
		{
			if (api.ILIsEqual(pid, ssfDRIVES)) {
				Items.AddItem(Addons.AboutRemember.PATH);
			}
		});
	}
} else {
	SetTabContents(0, "", '<label>Add</label><br><label><input type="checkbox" id="AddToMenu">Menus</label>');
}
