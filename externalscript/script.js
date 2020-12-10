if (window.Addon == 1) {
	const o = await api.CreateObject("Object");
	o.Exec = function (Ctrl, s, type, hwnd, pt) {
		const ar = s.split("\n");
		while (ar.length) {
			$.importScript(ar.shift());
		}
	};
	o.Result = S_OK;
	o.Ref = OpenDialog;
	AddType("External script", o);
}
