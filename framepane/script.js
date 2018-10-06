var Addon_Id = "framepane";
var item = GetAddonElement(Addon_Id);

Addons.FramePane = {
	ep: {
		Commands: "{D9745868-CA5F-4A76-91CD-F5A129FBB076}",
		Commands_organize: "{72E81700-E3EC-4660-BF24-3C3B7B648806}",
		Commands_view: "{21F7C32D-EEAA-439B-BB51-37B96FD6A943}",
		Details: "{43ABF98B-89B8-472D-B9CE-E69B8229F019}",
		Navigation: "{CB316B22-25F7-42B8-8A09-540D23A43C2F}",
		Preview: "{893C63D1-45C8-4D17-BE19-223BE71BE365}",
	},
	State: {}
}

if (window.Addon == 1) {
	AddEvent("GetPaneState", function (Ctrl, ep, peps)
	{
		var s = Addons.FramePane.State[ep.toUpperCase()];
		if (s) {
			peps[0] = s | 0x20000;
			return S_OK;
		}
	});
	for (var n in Addons.FramePane.ep) {
		Addons.FramePane.State[Addons.FramePane.ep[n]] = api.LowPart(item.getAttribute(n));
	}
} else {
	var t = GetText("Tool bar");
	var r = {
		Commands: t,
		Commands_organize: t + "(" + GetTextR("@shell32.dll,-31411") + ")",
		Commands_view: t + "(" + GetTextR("@shell32.dll,-31145") + ")",
		Details: GetTextR("@shell32.dll,-31415"),
		Navigation: GetTextR("@shell32.dll,-31421"),
		Preview: GetTextR("@shell32.dll,-31423"),
	};
	var s = [];
	var ar = ["Default", "Visible", "Hidden"];
	for (var n in Addons.FramePane.ep) {
		s.push(r[n], '<input type="text" name="', n, '" style="display: none"><br>');
		for (var i = 0; i < ar.length; i++) {
			s.push('<input type="radio" name="', n, '_" id="', n, '=', i, '" onclick="SetRadio(this)"', i ? "" : " checked" ,'><label for="', n, '=', i, '">', ar[i], '</label>&nbsp;');
		}
		s.push("<br>");
	}
	s.push("<br>It takes time to apply these changes.");
	SetTabContents(0, "General", s);
}
