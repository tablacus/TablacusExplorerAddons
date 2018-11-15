var ado = OpenAdodbFromTextFile("addons\\" + Addon_Id + "\\options.html");
if (ado) {
	SetTabContents(0, "General", ado.ReadText(adReadAll));
	ado.Close();
}

Addons.ReplaceCommand =
{
	BrowseFile1: function ()
	{
		var FV = GetFolderView();
		var path = OpenDialog(fso.GetParentFolderName(document.F.elements["_file"].value) || FV.FolderItem.Path);
		if (path) {
			document.F.elements["_aqs"].value = document.F.elements["_aqs"].value.replace("$1", path);
		}
	},

	BrowseFile: function ()
	{
		var FV = GetFolderView();
		var path = OpenDialog(fso.GetParentFolderName(document.F.elements["_file"].value) || FV.FolderItem.Path);
		if (path) {
			document.F.elements["_file"].value = path;
		}
	},

	BrowseVerb: function (o)
	{
		var hMenu = api.CreatePopupMenu();
		var Item = this.GetItem();
		var ContextMenu = api.ContextMenu(Item);
		if (ContextMenu) {
			ContextMenu.QueryContextMenu(hMenu, 0, 1, 0x7FFF, CMF_EXTENDEDVERBS | CMF_DONOTPICKDEFAULT | CMF_ITEMMENU);
			var mii = api.Memory("MENUITEMINFO");
			mii.cbSize = mii.Size;
			mii.fMask = MIIM_ID;
			for (var i = api.GetMenuItemCount(hMenu); i--;) {
				api.GetMenuItemInfo(hMenu, i, true, mii);
				var strVerb = ContextMenu.GetCommandString(mii.wID - ContextMenu.idCmdFirst, GCS_VERB);
				if (!strVerb || !api.AssocQueryString(ASSOCF_NONE, ASSOCSTR_COMMAND, Item, (strVerb == "default" || !strVerb) ? null : strVerb)) {
					api.DeleteMenu(hMenu, i, MF_BYPOSITION);
				}
			}
			pt = GetPos(o, true);
			pt.y += o.offsetHeight;
			var nVerb = api.TrackPopupMenuEx(hMenu, TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null, ContextMenu);
			document.F.elements["_verb"].value = ContextMenu.GetCommandString(nVerb - ContextMenu.idCmdFirst, GCS_VERB) || "default";
		}
		api.DestroyMenu(hMenu);
		this.Get();
	},

	Get: function ()
	{
		var strVerb = document.F.elements["_verb"].value;
		document.F.elements["_aqs"].value = api.AssocQueryString(ASSOCF_NONE, ASSOCSTR_COMMAND, this.GetItem(), (strVerb == "default" || !strVerb) ? null : strVerb);
	},

	SetRE: function ()
	{
		var s = document.F.elements["_aqs"].value;
		if (!s || /^[\/\|!#]/.test(s)) {
			return;
		}
		var spliter;
		var ar = ["/", "|", "!",  "#"];
		for (var i = 0; i < ar.length; i++) {
			spliter = ar[i];
			if (s.indexOf(spliter) < 0) {
				break;
			}
		}
		var sr = s.replace(/([\+\*\.\?\^\$\[\-\]\|\(\)\\])/g, "\\$1");
		var arg = api.CommandLineToArgv(sr);
		var d = /^"/.test(s) ? 2 : 0;
		sr = '^(' + sr.substr(0, arg[0].length + d) + ')' + sr.substr(arg[0].length + d) + "$";
		var arg = api.CommandLineToArgv(s);
		s = "$1" + s.substr(arg[0].length + d);
		document.F.elements["_aqs"].value = spliter + sr + spliter + s + spliter + "i";
	},

	Add: function ()
	{
		var s = document.F.elements["_aqs"].value;
		if (/^[\/\|!#]/.test(s)) {
			var r = document.F.re.value;
			if (!r || /\n$/.test(r)) {
				document.F.re.value += s;
			} else {
				document.F.re.value += "\n" + s;
			}
		}
	},

	GetItem: function ()
	{
		var Item = document.F.elements["_file"].value;
		if (!Item) {
			var FV = GetFolderView();
			var Selected = FV.SelectedItems();
			Item = Selected.Count ? Selected.Item(0) : FV.FolderItem;
		}
		return Item;
	}
}