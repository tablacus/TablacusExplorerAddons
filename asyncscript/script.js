if (window.Addon == 1) {
	AddType("Async script",
	{
		Exec: function (Ctrl, s, type, hwnd, pt)
		{
			var FV = GetFolderView(Ctrl, pt);
			OpenNewProcess(s,
			{
				Ctrl: Ctrl,
				pt: pt,
				FV: FV,
				SessionId: FV.SessionId
			});
			return S_OK;
		},

		Ref: OpenDialog
	});
}
