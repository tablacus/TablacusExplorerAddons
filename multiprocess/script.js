const Addon_Id = "multiprocess";
const item = await GetAddonElement(Addon_Id);
if (!GetNum(item.getAttribute("Delete")) && !GetNum(item.getAttribute("Paste")) && !GetNum(item.getAttribute("Drop")) && !GetNum(item.getAttribute("RDrop"))) {
	item.setAttribute("Delete", 1);
	item.setAttribute("Paste", 1);
	item.setAttribute("Drop", 1);
	item.setAttribute("RDrop", 1);
}
Addons.MultiProcess = {
	File: item.getAttribute("File"),

	Player: function (autoplay) {
		if (Addons.MultiProcess.tid) {
			clearTimeout(Addons.MultiProcess.tid);
			Addons.MultiProcess.tid = null;
		}
		var el;
		var src = ExtractPath(te, (autoplay === true) ? Addons.MultiProcess.File : document.F.File.value);
		if (autoplay === true && api.PathMatchSpec(src, "*.wav")) {
			api.PlaySound(src, null, 1);
			return;
		}
		if (ui_.IEVer >= 11 && api.PathMatchSpec(src, "*.mp3;*.m4a;*.webm;*.mp4")) {
			el = document.createElement('audio');
			if (autoplay === true) {
				el.setAttribute("autoplay", "true");
			} else {
				el.setAttribute("controls", "true");
			}
			if (autoplay === true) {
				el.setAttribute("autoplay", "true");
			}
		} else {
			el = document.createElement('embed');
			el.setAttribute("volume", "0");
			el.setAttribute("autoplay", autoplay === true);
		}
		el.src = src;
		el.setAttribute("style", "width: 100%; height: 3.5em");
		var o = document.getElementById('multiprocess_player');
		while (o.firstChild) {
			o.removeChild(o.firstChild);
		}
		if (src) {
			o.appendChild(el);
		}
	}
};

if (window.Addon == 1) {
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
	document.getElementById('None').insertAdjacentHTML("BeforeEnd", '<div id="multiprocess_player"></div>');
} else {
	SetTabContents(0, "", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));
	Addons.MultiProcess.Player();
}
