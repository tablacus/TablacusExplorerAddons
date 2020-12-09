if (window.Addon == 1) {
	const o = await api.CreateObject("Object");
	o.Exec = async function (Ctrl, s, type, hwnd, pt) {
		const FV = await GetFolderView(Ctrl, pt);
		const o = await api.CreateObject("Object");
		o.Ctrl = Ctrl;
		o.pt = pt;
		o.FV = FV;
		o.SessionId = await FV.SessionId;
		OpenNewProcess(s, o);
	};
	o.Result = S_OK;
	o.Ref = OpenDialog
	AddType("Async script", o);
}
