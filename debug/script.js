const Addon_Id = "debug";
const Default = "BottomBar2Left";
if (window.Addon == 1) {
	Addons.Debug = {
		alert: function (s) {
			const o = document.getElementById("debug");
			o.value += "\n" + (s.join ? s.join(",") : s);
			o.scrollTop = o.scrollHeight;
		},

		set: function (s) {
			const o = document.getElementById("debug");
			o.value = (s.join ? s.join("\n") : s);
		},

		clear: function () {
			Addons.Debug.set("Ready.");
		}
	};

	AddEvent("Layout", async function () {
		SetAddon(Addon_Id, Default, '<textarea id="debug" style="width: 100%; height: 100px">Ready.</textarea>');
	});

	AddEvent("Finalize", Addons.Debug.clear);
}
