var Addon_Id = "gflsdk";

if (window.Addon == 1) {
	Addons.GFLSDK =
	{
		DLL: api.DllGetClassObject(fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), ["addons\\gflsdk\\tgflsdk", api.sizeof("HANDLE") * 8, ".dll"].join("")), "{04D5F147-2A06-4760-9120-7CAE154FBB21}"),
		Finalize: function ()
		{
			if (Addons.GFLSDK.GFL) {
				Addons.GFLSDK.GFL.gflLibraryExit();
				delete Addons.GFLSDK.GFL;
				CollectGarbage();
			}
			delete Addons.GFLSDK.DLL;
		}
	};

	AddEvent("AddonDisabled", function (Id)
	{
		if (Id.toLowerCase() == "gflsdk") {
			Addons.GFLSDK.Finalize();
		}
	});

	if (Addons.GFLSDK.DLL) {
		AddEvent("Load", function ()
		{
			var item = GetAddonElement(Addon_Id);
			var bit = api.sizeof("HANDLE") * 8;
			Addons.GFLSDK.GFL = Addons.GFLSDK.DLL.Open(api.PathUnquoteSpaces(ExtractMacro(te, item.getAttribute('dll' + bit))), api.PathUnquoteSpaces(ExtractMacro(te, item.getAttribute('dlle' + bit))));
			if (Addons.GFLSDK.GFL  && Addons.GFLSDK.GFL.gflLibraryInit && Addons.GFLSDK.GFL.gflLibraryExit && Addons.GFLSDK.GFL.gflLoadBitmap && Addons.GFLSDK.GFL.gflConvertBitmapIntoDDB) {
				Addons.GFLSDK.GFL.gflLibraryInit();
				te.AddEvent("GetImage", Addons.GFLSDK.GFL.GetImage);
			}
		});
	}
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}