if (window.Addon == 1) {
	AddType("External script",
	{
		Exec: function (Ctrl, s, type, hwnd, pt)
		{
			var ar = s.split("\n");
			while (ar.length) {
				importScripts(ar.shift());
			}
			return S_OK;
		},

		Ref: OpenDialog
	});
}
