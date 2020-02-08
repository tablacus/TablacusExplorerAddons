if (window.Addon == 1) {
	AddEvent("Error", function (FV) {
		FV.Close();
		return S_OK;
	});
}
