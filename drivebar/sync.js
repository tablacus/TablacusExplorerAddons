const Addon_Id = "drivebar";
const item = GetAddonElement(Addon_Id);

Sync.DriveBar = {
	Filter: ExtractFilter(item.getAttribute("Filter") || "*"),
	Disable: ExtractFilter(item.getAttribute("Disable") || "-"),

	Update: function () {
		const arHTML = [];
		const h = GetIconSize(0, 16);
		const icon = [53, 7, 8, 9, 11, 12];
		const Items = sha.NameSpace(ssfDRIVES).Items();
		const nCount = Items.Count;
		for (let i = 0; i < nCount; ++i) {
			const Item = Items.Item(i);
			const path = Item.Path;
			const letter = path.charAt(0);
			if (!PathMatchEx(path, Sync.DriveBar.Filter) || PathMatchEx(path, Sync.DriveBar.Disable)) {
				continue;
			}
			if (path.length == 3 || (/^[:;]/.test(letter) && !IsUseExplorer(Item))) {
				const vol = api.GetDisplayNameOf(Item, SHGDN_INFOLDER);
				let src = '';
				if (g_.IEVer >= 8) {
					src = GetIconImage(Item, GetSysColor(COLOR_BTNFACE));
				}
				if (!src) {
					let nIcon = icon[0];
					if (letter >= 'A' && letter <= 'Z') {
						try {
							const oDrive = fso.GetDrive(letter);
							nIcon = oDrive ? icon[oDrive.DriveType] : icon[0];
						} catch (e) {
							nIcon = 10;
						}
					}
					src = MakeImgSrc('icon:shell32.dll,' + nIcon, 0, false, h);
				}
				arHTML.push('<span class="button" title="', vol, '" path="', path, '" onclick="Addons.DriveBar.Open(this)" oncontextmenu="Addons.DriveBar.Popup(event, this); return false" onmouseover="MouseOver(this)" onmouseout="MouseOut()"><span class="drive">', letter, '</span><img src="', src, '" width="', h, 'px" height = "', h, 'px"></span>');
			}
		}
		InvokeUI("Addons.DriveBar.Update", [arHTML.join("")]);
	}
};

AddEvent("DeviceChanged", Sync.DriveBar.Update);
AddEvent("ChangeNotify", async function (Ctrl, pidls, wParam, lParam) {
	if (pidls.lEvent & (SHCNE_MEDIAINSERTED | SHCNE_MEDIAREMOVED | SHCNE_DRIVEREMOVED | SHCNE_DRIVEADD | SHCNE_NETSHARE | SHCNE_NETUNSHARE)) {
		Sync.DriveBar.Update();
	}
});
Sync.DriveBar.Update();
