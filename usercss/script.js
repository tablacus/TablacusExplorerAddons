var Addons_Id = "usercss"
if (window.Addon == 1) {
	AddEvent("BrowserCreated", function (doc)
	{
		var link = doc.createElement("link");
		link.rel = "stylesheet";
		link.type = "text/css";
		link.href = fso.BuildPath(te.Data.DataFolder, "config\\user.css");
		doc.getElementsByTagName("head").item(0).appendChild(link);
	});
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
