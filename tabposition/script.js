var Addon_Id = "tabposition";

if (window.Addon == 1) {
	Addons.TabPositon = {
		nNew: GetAddonOptionEx(Addon_Id, "NewTab"),
		nClose: GetAddonOptionEx(Addon_Id, "Close")
	};

	AddEvent("Close", function (Ctrl) {
		var FV;
		if (Ctrl.Type <= CTRL_EB) {
			var TC = Ctrl.Parent;
			var nIndex = TC.SelectedIndex;
			if (nIndex == Ctrl.Index) {
				switch (Addons.TabPositon.nClose) {
					case 0:
						var nActive = MAXINT;
						for (var i = TC.Count; i-- > 0;) {
							FV = TC[i];
							if (FV && FV.Data && FV.Data.nActive) {
								if (FV.Data.nActive < nActive) {
									nActive = FV.Data.nActive;
									nIndex = i;
								}
							}
						}
						break;
					case 1:
						var Parent = api.ILGetParent(Ctrl);
						for (var i in TC) {
							FV = TC[i];
							if (FV && api.ILIsEqual(FV, Parent)) {
								nIndex = i;
								break;
							}
						}
						break;
					case 2:
						return;
					case 3:
						if (nIndex > 0) {
							nIndex--;
						}
						break;
					case 4:
						nIndex = TC.Count - 1;
						break;
					case 5:
						nIndex = 0;
						break;
				}
				if (nIndex && TC.SelectedIndex.Index <= nIndex) {
					nIndex--;
				}
				TC.SelectedIndex = nIndex;
			}
		}
	});

	AddEvent("SelectionChanged", function (Ctrl, uChange) {
		var FV;
		if (Ctrl.Type == CTRL_TC) {
			for (var i = Ctrl.Count; i-- > 0;) {
				FV = Ctrl[i];
				if (FV && FV.Data) {
					FV.Data.nActive = (FV.Data.nActive || 0) + 1;
					if (FV.Data.Created) {
						if (new Date().getTime() - FV.Data.Created < 9999) {
							if (Addons.TabPositon.nNew) {
								Ctrl.Move(i, Ctrl.Count - 1);
							}
						}
						delete FV.Data.Created;
					}
				}
			}
			var FV = Ctrl.Selected;
			if (FV && FV.Data) {
				FV.Data.nActive = 0;
			}
		}
	});

	AddEvent("Create", function (Ctrl) {
		if (Ctrl.Type <= CTRL_EB && !g_.LockUpdate) {
			Ctrl.Data.Created = new Date().getTime();
		}
	});
} else {
	var ado = OpenAdodbFromTextFile("addons\\" + Addon_Id + "\\options.html");
	if (ado) {
		SetTabContents(0, "", ado.ReadText(adReadAll));
		ado.Close();
	}
}
