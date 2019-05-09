var Addon_Id = "closeduplicatetabs";
var Default = "None";

var item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "Tabs");
	item.setAttribute("MenuPos", -1);
}
if (window.Addon == 1) {
	Addons.CloseDuplicateTabs =
	{
		strName: item.getAttribute("MenuName") || GetAddonInfo(Addon_Id).Name,
		nPos: api.LowPart(item.getAttribute("MenuPos")),

		Exec: function (Ctrl, pt)
		{
			var db = {};
			var FV = GetFolderView(Ctrl, pt);
			FV.Focus();
			var TC = FV.Parent;
			for (var i = TC.Count; i-- > 0;) {
				var Item = TC.Item(i);
				var path = api.GetDisplayNameOf(Item, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_FORPARSINGEX);
				if (db[path]) {
					db[path].push(Item);
				} else {
					db[path] = [Item];
				}
			}
			setTimeout(function ()
			{
				var SelectedIndex = TC.SelectedIndex;
				for (var i in db) {
					var cFV = db[i];
					var bSelected = false;
					for (var j = cFV.length; cFV.length > 1 && j-- > 0;) {
						var FV = cFV[j];
						var nIndex = FV.Index;
						if (FV.Close()) {
							cFV.splice(j, 1);
							bSelected |= nIndex == SelectedIndex;
						}
					}
					if (bSelected) {
						TC.SelectedIndex = cFV[0].Index;
					}
				}
			}, 99);
			return S_OK;
		}
	};
	if (item) {
		//Menu
		if (item.getAttribute("MenuExec")) {
			AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
			{
				api.InsertMenu(hMenu, Addons.CloseDuplicateTabs.nPos, MF_BYPOSITION | MF_STRING, ++nPos, GetText(Addons.CloseDuplicateTabs.strName));
				ExtraMenuCommand[nPos] = Addons.CloseDuplicateTabs.Exec;
				return nPos;
			});
		}
		//Key
		if (item.getAttribute("KeyExec")) {
			SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.CloseDuplicateTabs.Exec, "Func");
		}
		//Mouse
		if (item.getAttribute("MouseExec")) {
			SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.CloseDuplicateTabs.Exec, "Func");
		}
		AddTypeEx("Add-ons", "Close duplicate tabs", Addons.CloseDuplicateTabs.Exec);
	}
	var h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.CloseDuplicateTabs.Exec(this);" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', GetImgTag({ title: Addons.CloseDuplicateTabs.strName, src: GetAddonOption(Addon_Id, "Icon") }, h), '</span>']);
} else {
	EnableInner();
}
