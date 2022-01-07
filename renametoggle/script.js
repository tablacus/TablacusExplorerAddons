const Addon_Id = "renametoggle";
const item = GetAddonElement(Addon_Id);
if (!item.getAttribute("Set")) {
	item.setAttribute("Key", "F2");
}
if (window.Addon == 1) {
	Addons.RenameToggle = {
		Exec: async function (Ctrl, pt) {
			const hEdit = await api.SendMessage(await Ctrl.hwndList, LVM_GETEDITCONTROL, 0, 0);
			const fn = await api.GetWindowText(hEdit);
			let st = await api.SendMessage(hEdit, 0xB0, 0, 0);//EM_GETSEL
			const ed = Math.floor(st >> 16);
			st &= 0xffff;
			if (fn.indexOf(".") >= 0) {
				if (st) {
					api.SendMessage(hEdit, 0xB1, 0, fn.length);//EM_SETSEL
				} else {
					if (ed == fn.length) {
						api.SendMessage(hEdit, 0xB1, 0, (await fso.GetBaseName(fn)).length);//EM_SETSEL
					} else {
						api.SendMessage(hEdit, 0xB1, fn.length - (await fso.GetExtensionName(fn)).length, fn.length);//EM_SETSEL
					}
				}
			} else {
				api.SendMessage(hEdit, 0xB1, 0, st == ed ? fn.length : 0);//EM_SETSEL
			}
		}
	};
	//Key
	SetKeyExec("Edit", item.getAttribute("Key"), Addons.RenameToggle.Exec, "Async");
} else {
	ChangeForm([
		["__KeyExec", "style/display", "none"],
	]);
}
