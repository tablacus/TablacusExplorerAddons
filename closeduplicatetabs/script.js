const Addon_Id = "closeduplicatetabs";
const Default = "None";
const item = await GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("MenuExec", 1);
	item.setAttribute("Menu", "Tabs");
	item.setAttribute("MenuPos", -1);
}
if (window.Addon == 1) {
	Addons.CloseDuplicateTabs = {
		Exec: async function (Ctrl, pt) {
			const db = {};
			const FV = await GetFolderView(Ctrl, pt);
			FV.Focus();
			const TC = await FV.Parent;
			for (let i = await TC.Count; i-- > 0;) {
				const Item = await TC[i];
				const path = await api.GetDisplayNameOf(Item, SHGDN_FORADDRESSBAR | SHGDN_FORPARSING | SHGDN_FORPARSINGEX);
				if (db[path]) {
					db[path].push(Item);
				} else {
					db[path] = [Item];
				}
			}
			setTimeout(async function () {
				const SelectedIndex = await TC.SelectedIndex;
				for (let i in db) {
					const cFV = db[i];
					let bSelected = false;
					for (let j = cFV.length; j-- > 0 && cFV.length > 1;) {
						const FV = cFV[j];
						const nIndex = await FV.Index;
						if (await FV.Close()) {
							cFV.splice(j, 1);
							bSelected |= nIndex == SelectedIndex;
						}
					}
					if (bSelected) {
						TC.SelectedIndex = await cFV[0].Index;
					}
				}
			}, 99);
			return S_OK;
		}
	};
	//Menu
	const strName = item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name;
	if (item.getAttribute("MenuExec")) {
		const o = api.CreateObject("Object");
		o.strMenu = item.getAttribute("Menu");
		o.strName = strName;
		o.nPos = GetNum(item.getAttribute("MenuPos"));
		Common.CloseDuplicateTabs = await o;
		$.importScript("addons\\" + Addon_Id + "\\sync.js");
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.CloseDuplicateTabs.Exec, "Async");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.CloseDuplicateTabs.Exec, "Async");
	}
	AddTypeEx("Add-ons", "Close duplicate tabs", Addons.CloseDuplicateTabs.Exec);

	const h = GetIconSize(item.getAttribute("IconSize"), item.getAttribute("Location") == "Inner" && 16);
	SetAddon(Addon_Id, Default, ['<span class="button" onclick="Addons.CloseDuplicateTabs.Exec(this);" onmouseover="MouseOver(this)" onmouseout="MouseOut()">', await GetImgTag({ title: item.getAttribute("MenuName") || await GetAddonInfo(Addon_Id).Name, src: item.getAttribute("Icon") }, h), '</span>']);
} else {
	EnableInner();
}
