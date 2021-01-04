const Addon_Id = "gflsdk";
const item = GetAddonElement(Addon_Id);

Sync.GFLSDK = {
	DLL: api.DllGetClassObject(BuildPath(te.Data.Installed, ["addons\\gflsdk\\tgflsdk", api.sizeof("HANDLE") * 8, ".dll"].join("")), "{04D5F147-2A06-4760-9120-7CAE154FBB21}"),

	Finalize: function () {
		if (Sync.GFLSDK.GFL) {
			te.RemoveEvent("GetImage", Sync.GFLSDK.GFL.GetImage);
			Sync.GFLSDK.GFL.gflLibraryExit();
			delete Sync.GFLSDK.GFL;
			CollectGarbage();
		}
		if (Sync.GFLSDK.DLL) {
			delete Sync.GFLSDK.DLL;
		}
	}
};

AddEvent("AddonDisabled", function (Id) {
	if (SameText(Id, "gflsdk")) {
		Sync.GFLSDK.Finalize();
	}
});

if (Sync.GFLSDK.DLL) {
	AddEvent("Load", function () {
		Sync.GFLSDK.GFL = Sync.GFLSDK.DLL.Open(ExtractPath(te, item.getAttribute('dll' + (api.sizeof("HANDLE") * 8))));
		if (Sync.GFLSDK.GFL && Sync.GFLSDK.GFL.gflLibraryInit && Sync.GFLSDK.GFL.gflLibraryExit && Sync.GFLSDK.GFL.gflLoadBitmap) {
			Sync.GFLSDK.GFL.gflLibraryInit();
			te.AddEvent("GetImage", Sync.GFLSDK.GFL.GetImage);
		}
	});
}
