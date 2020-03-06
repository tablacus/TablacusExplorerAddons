var Addon_Id = "gflsdk";

Addons.GFLSDK =
{
	DLL: api.DllGetClassObject(fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), ["addons\\gflsdk\\tgflsdk", api.sizeof("HANDLE") * 8, ".dll"].join("")), "{04D5F147-2A06-4760-9120-7CAE154FBB21}"),
}
if (window.Addon == 1) {
	Addons.GFLSDK.Finalize = function () {
		if (Addons.GFLSDK.GFL) {
			te.RemoveEvent("GetImage", Addons.GFLSDK.GFL.GetImage);
			Addons.GFLSDK.GFL.gflLibraryExit();
			delete Addons.GFLSDK.GFL;
			CollectGarbage();
		}
		if (Addons.GFLSDK.DLL) {
			delete Addons.GFLSDK.DLL;
		}
	}

	AddEvent("AddonDisabled", function (Id) {
		if (Id.toLowerCase() == "gflsdk") {
			Addons.GFLSDK.Finalize();
		}
	});

	if (Addons.GFLSDK.DLL) {
		AddEvent("Load", function () {
			var item = GetAddonElement(Addon_Id);
			var bit = api.sizeof("HANDLE") * 8;
			Addons.GFLSDK.GFL = Addons.GFLSDK.DLL.Open(api.PathUnquoteSpaces(ExtractMacro(te, item.getAttribute('dll' + bit))));
			if (Addons.GFLSDK.GFL && Addons.GFLSDK.GFL.gflLibraryInit && Addons.GFLSDK.GFL.gflLibraryExit && Addons.GFLSDK.GFL.gflLoadBitmap) {
				Addons.GFLSDK.GFL.gflLibraryInit();
				te.AddEvent("GetImage", Addons.GFLSDK.GFL.GetImage);
			}
		});
	}
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
