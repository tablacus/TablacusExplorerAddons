if (window.Addon == 1) {
	AddEvent("BrowserCreatedEx", await ReadTextFile("addons\\inputcontextmenu\\handler.js"));
}
