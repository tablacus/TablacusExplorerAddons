const Addon_Id = "simpletoolbar";
const Default = "ToolBar2Left";

if (window.Addon == 1) {
	Addons.SimpleAddressBar = {
		Exec: async function (ev, n) {
			const pt = await api.Memory("POINT");
			pt.x = ev.screenX * ui_.Zoom;
			pt.y = ev.screenY * ui_.Zoom;
			const FV = await GetFolderView();
			Exec(FV, n, "Tabs", ui_.hwnd, pt);
		}
	};
	const a = {
		Back: ['bitmap:ieframe.dll,216,16,0', 'bitmap:ieframe.dll,214,24,0'],
		Forward: ['bitmap:ieframe.dll,216,16,1', 'bitmap:ieframe.dll,214,24,1'],
		Up: ['bitmap:ieframe.dll,216,16,28', 'bitmap:ieframe.dll,214,24,28'],
		"New tab": ['bitmap:ieframe.dll,216,16,12', 'bitmap:ieframe.dll,214,24,12'],
		Refresh: ['bitmap:ieframe.dll,206,16,3', 'bitmap:ieframe.dll,204,24,3']
	};
	const s = [];
	const h = GetIconSize(await GetAddonOption(Addon_Id, "IconSize"));
	for (let n in a) {
		s.push('<span class="button" onmouseover="MouseOver(this)" onmouseout="MouseOut()" onclick="Addons.SimpleAddressBar.Exec(event, \'' + n + '\')" oncontextmenu="return false;">', await GetImgTag({ title: n, src: a[n][h == 16 ? 0 : 1] }, h), '</span>');
	}
	SetAddon(Addon_Id, Default, s);
}
