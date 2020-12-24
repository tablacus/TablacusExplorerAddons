const Addon_Id = "sizebarchart";
const item = GetAddonElement(Addon_Id);

Sync.SizeBarChart = {
	Color: GetBGRA(GetWinColor(item.getAttribute("Color") || "#008080"), (item.getAttribute("Alpha") & 0xff) || 128),
	Height: Math.max(GetNum(item.getAttribute("Height")) || 3, 1),
	Filter: item.getAttribute("Filter") || "*"
}

AddEvent("ItemPostPaint2", function (Ctrl, pid, nmcd, vcd) {
	const hList = Ctrl.hwndList;
	if (hList && pid) {
		let s = api.GetDisplayNameOf(pid, SHGDN_FORPARSING | SHGDN_ORIGINAL);
		if (PathMatchEx(s, Sync.SizeBarChart.Filter)) {
			if (s = Ctrl.TotalFileSize[s] || pid.ExtendedProperty("size")) {
				const w = Math.min(Math.pow(s, .25) / 270, 1) * (nmcd.rc.right - nmcd.rc.left - 2) + 1;
				const h = Math.min(Sync.SizeBarChart.Height, nmcd.rc.bottom - nmcd.rc.top);
				const image = api.CreateObject("WICBitmap").Create(w, h);
				if (image) {
					image.FillRect(0, 0, w, h, Sync.SizeBarChart.Color);
					image.DrawEx(nmcd.hdc, nmcd.rc.left + 1, nmcd.rc.bottom - h, 0, 0, CLR_NONE, CLR_NONE, ILD_NORMAL);
				}
			}
		}
	}
}, true);

