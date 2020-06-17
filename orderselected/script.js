if (window.Addon == 1) {
	te.ViewOrder = 1;
	te.Data.Conf_ViewOrder = 1;

	AddEvent("AddonDisabled", function (Id) {
		if (Id.toLowerCase() == "orderselected") {
			te.ViewOrder = 0;
			te.Data.Conf_ViewOrder = 0;
		}
	});
}
