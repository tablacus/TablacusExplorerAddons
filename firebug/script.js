if (window.Addon == 1) {
	Addons.Firebug = {
		Resize: function () {
			Addons.Firebug.div.style.height = Addons.Firebug.fbChrome.offsetHeight + "px";
			Resize();
		},

		Init: function () {
			if (window.Firebug) {
				Firebug.extend(function (FBL) {
					Addons.Firebug.fbChrome = FBL.$("fbChrome");
					Addons.Firebug.fbChrome.onmouseup = Addons.Firebug.Resize;
					Addons.Firebug.Resize();
				});
			} else {
				setTimeout(Addons.Firebug.Init, 1000);
			}
		}

	};

	var firebug = document.createElement('script');
	firebug.setAttribute('src', 'https://cdnjs.cloudflare.com/ajax/libs/firebug-lite/1.4.0/firebug-lite.js#overrideConsole=true,startOpened=true,enableTrace=true');
	document.body.appendChild(firebug);

	Addons.Firebug.div = document.createElement('div');
	document.getElementById("bottombar").appendChild(Addons.Firebug.div);

	setTimeout(Addons.Firebug.Init, 999);
}
