const Addon_Id = "debug";
const Default = "BottomBar2Left";
let item = await GetAddonElement(Addon_Id);
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

	if (item.getAttribute("ChangeNotify")) {
		Addons.Debug.CNDB = {
			1: "RENAMEITEM",
			2: "CREATE",
			4: "DELETE",
			8: "MKDIR",
			16: "RMDIR",
			32: "MEDIAINSERTED",
			64: "MEDIAREMOVED",
			128: "DRIVEREMOVED",
			256: "DRIVEADD",
			512: "NETSHARE",
			1024: "NETUNSHARE",
			2048: "ATTRIBUTES",
			4096: "UPDATEDIR",
			8192: "UPDATEITEM",
			16384: "SERVERDISCONNECT",
			32768: "UPDATEIMAGE",
			65536: "DRIVEADDGUI",
			131072: "RENAMEFOLDER",
			262144: "FREESPACE",
			67108864: "EXTENDED",
			134217728: "ASSOCCHANGED"
		};

		AddEvent("ChangeNotify", async function (Ctrl, pidls, wParam, lParam) {
			const l = await pidls.lEvent;
			const ar = [Addons.Debug.CNDB[l] || ("0000000" + l.toString(16)).substr(-8)];
			let path = await api.GetDisplayNameOf(await pidls[0], SHGDN_FORPARSING);
			if (/^[A-Z]:\\|^\\\\\w|^::{/i.test(path)) {
				ar.push(path);
			}
			if (l == SHCNE_RENAMEITEM || l == SHCNE_RENAMEFOLDER) {
				path = await api.GetDisplayNameOf(await pidls[1], SHGDN_FORPARSING);
				if (/^[A-Z]:\\|^\\\\\w|^::{/i.test(path)) {
					ar.push(path);
				}
			}
			Addons.Debug.alert(ar.join(" : "));
		});
	}

	AddEvent("Layout", function () {
		return SetAddon(Addon_Id, Default, '<textarea id="debug" style="width: 100%; height: 100px">Ready.</textarea>');
	});

	AddEvent("Finalize", Addons.Debug.clear);

	delete item;
} else {
	SetTabContents(0, "General", '<label><input type="checkbox" id="ChangeNotify">Change notify</label>');
}
