var Addon_Id = "dragdrop";

if (window.Addon == 1) {
	var mode = GetAddonOptionEx("dragdrop", "Mode");

	if (mode == 1) {
		AddEvent("DragOver", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect, pgrfKeyState)
		{
			if (grfKeyState <= (MK_LBUTTON | MK_RBUTTON)) {
				pgrfKeyState[0] |= MK_CONTROL;
			}
		}, true);
	} else if (mode == 2) {
		AddEvent("DragOver", function (Ctrl, dataObj, grfKeyState, pt, pdwEffect, pgrfKeyState)
		{
			if (grfKeyState <= (MK_LBUTTON | MK_RBUTTON)) {
				pgrfKeyState[0] |= MK_SHIFT;
			}
		}, true);
	}
} else {
	var ado = OpenAdodbFromTextFile("addons\\" + Addon_Id + "\\options.html");
	if (ado) {
		SetTabContents(0, "General", ado.ReadText(adReadAll));
		ado.Close();
	}
}
