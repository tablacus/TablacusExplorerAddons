var Addon_Id = "drivebar";
var Default = "ToolBar1Right";
var item = await GetAddonElement(Addon_Id);
if (window.Addon == 1) {
	Addons.DriveBar = {
		Filter: await ExtractFilter(item.getAttribute("Filter") || "*"),
		Disable: await ExtractFilter(item.getAttribute("Disable") || "-"),
		Items: [],

		Open: function (o) {
			var path = o.path || o.getAttribute("path");
			Navigate(path, SBSP_NEWBROWSER);
		},

		Popup: async function (ev, o) {
			var path = o.path || o.getAttribute("path");
			var ContextMenu = await api.ContextMenu(path);
			if (ContextMenu) {
				var hMenu = await api.CreatePopupMenu();
				await ContextMenu.QueryContextMenu(hMenu, 0, 1, 0x7FFF, CMF_NORMAL);
				var x = ev.screenX * ui_.Zoom;
				var y = ev.screenY * ui_.Zoom;
				var nVerb = await api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, x, y, ui_.hwnd, null, ContextMenu);
				if (nVerb) {
					ContextMenu.InvokeCommand(0, ui_.hwnd, nVerb - 1, null, null, SW_SHOWNORMAL, 0, 0);
				}
				api.DestroyMenu(hMenu);
			}
		},

		Update: async function () {
			var h = GetIconSize(0, 16);
			var icon = [53, 7, 8, 9, 11, 12];
			var arDrive = [];
			var Items = await sha.NameSpace(ssfDRIVES).Items();
			var nCount = await Items.Count;
			for (var i = 0; i < nCount; ++i) {
				var Item = await Items.Item(i);
				var path = await Item.Path;
				var letter = path.charAt(0);
				if (!await PathMatchEx(path, Addons.DriveBar.Filter) || await PathMatchEx(path, Addons.DriveBar.Disable)) {
					continue;
				}
				if (path.length == 3 || (/^[:;]/.test(letter) && !await IsUseExplorer(Item))) {
					var vol = await api.GetDisplayNameOf(Item, SHGDN_INFOLDER);
					var src = '';
					if (ui_.IEVer >= 8) {
						src = await GetIconImage(Item, await GetSysColor(COLOR_BTNFACE));
					}
					if (!src) {
						var nIcon = icon[0];
						if (letter >= 'A' && letter <= 'Z') {
							try {
								var oDrive = await fso.GetDrive(letter);
								nIcon = oDrive ? icon[await oDrive.DriveType] : icon[0];
							} catch (e) {
								nIcon = 10;
							}
						}
						src = await MakeImgSrc('icon:shell32.dll,' + nIcon, 0, false, h);
					}
					arDrive.push('<span class="button" title="', vol, '" path="', path, '" onclick="Addons.DriveBar.Open(this)" oncontextmenu="Addons.DriveBar.Popup(event, this); return false" onmouseover="MouseOver(this)" onmouseout="MouseOut()"><span class="drive">', letter, '</span>', await GetImgTag({ src: src }, h), '</span>');
				}
			}
			document.getElementById("drivebar").innerHTML = arDrive.join("");
		}
	};

	AddEvent("Load", function () {
		setTimeout(Addons.DriveBar.Update, 99);
	});

	AddEvent("DeviceChanged", Addons.DriveBar.Update);

	AddEvent("ChangeNotify", async function (Ctrl, pidls, wParam, lParam) {
		if (await pidls.lEvent & (SHCNE_MEDIAINSERTED | SHCNE_MEDIAREMOVED | SHCNE_DRIVEREMOVED | SHCNE_DRIVEADD | SHCNE_NETSHARE | SHCNE_NETUNSHARE)) {
			Addons.DriveBar.Update();
		}
	});

	SetAddon(Addon_Id, Default, '<span id="drivebar"></span>');
} else {
	SetTabContents(0, "General", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));
}
