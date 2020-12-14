Sync.Underline = {
	Pen: api.CreatePen(PS_SOLID, 1, GetWinColor(GetAddonOption("underline", "Color") || "#ececec"))
};

AddEvent("ItemPostPaint2", function (Ctrl, pid, nmcd, vcd) {
	if (Ctrl.Type <= CTRL_EB && pid) {
		const hOld = api.SelectObject(nmcd.hdc, Sync.Underline.Pen);
		api.MoveToEx(nmcd.hdc, nmcd.rc.right, nmcd.rc.bottom - 1, null);
		api.LineTo(nmcd.hdc, nmcd.rc.left, nmcd.rc.bottom - 1);
		api.SelectObject(nmcd.hdc, hOld);
	}
});

AddEvent("Finalize", function () {
	api.DeleteObject(Sync.Underline.Pen);
});
