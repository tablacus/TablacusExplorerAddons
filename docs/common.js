var fso = null;
var Lang = navigator.userLanguage;
if (!Lang) {
	Lang = navigator.language;
}
if (!Lang) {
	Lang = navigator.browserLanguage;
}
if (!Lang) {
	Lang = "en";
}
Lang = Lang.replace(/\-.*/,"");

te = {
	Data: {
		Conf_Lang: Lang,
		Lang: {}
	}
}

if (Lang == "ja") {
	te.Data.Lang.Download = "ダウンロード";
	te.Data.Lang.Search = "検索";
	te.Data.Lang.Filter = "フィルタ";
}

function createHttpRequest()
{
	if (window.XMLHttpRequest) {
		return new XMLHttpRequest();
	}
	else if (window.ActiveXObject) {
		try {
			return new ActiveXObject("Msxml2.XMLHTTP");
		} catch(e) {
			return new ActiveXObject("Microsoft.XMLHTTP");
		}
	} 
	else {
		return null;
	}
}

function ApplyLang(doc)
{
	var i;
	var Lang = te.Data.Lang;
	var o = doc.getElementsByTagName("a");
	if (o) {
		for (i = 0; i < o.length; i++) {
			var s = Lang[o[i].innerHTML.replace(/&amp;/ig, "&")];
			if (!s) {
				s = o[i].innerHTML;
			}
			o[i].innerHTML = amp2ul(s);
			var s = Lang[o[i].title];
			if (s) {
				o[i].title = s;
			}
			var s = Lang[o[i].alt];
			if (s) {
				o[i].alt = s;
			}
		}
	}
	var o = doc.getElementsByTagName("input");
	if (o) {
		for (i = 0; i < o.length; i++) {
			var s = Lang[o[i].title];
			if (s) {
				o[i].title = s;
			}
			var s = Lang[o[i].alt];
			if (s) {
				o[i].alt = s;
			}
			if (o[i].type == "button") {
				s = Lang[o[i].value];
				if (s) {
					o[i].value = s;
				}
			}
		}
	}
	var o = doc.getElementsByTagName("img");
	if (o) {
		for (i = 0; i < o.length; i++) {
			var s = Lang[o[i].title];
			if (s) {
				o[i].title = delamp(s);
			}
			var s = Lang[o[i].alt];
			if (s) {
				o[i].alt = delamp(s);
			}
		}
	}
	var o = doc.getElementsByTagName("select");
	if (o) {
		for (i = 0; i < o.length; i++) {
			for (var j = 0; j < o[i].length; j++) {
				var s = Lang[o[i][j].text.replace(/^\n/, "").replace(/\n$/, "")];
				if (s) {
					o[i][j].text = s;
				}
			}
		}
	}
	var o = doc.getElementsByTagName("label");
	if (o) {
		for (i = 0; i < o.length; i++) {
			var s = Lang[o[i].innerHTML.replace(/&amp;/ig, "&")];
			if (!s) {
				s = o[i].innerHTML;
			}
			o[i].innerHTML = amp2ul(s);
			var s = Lang[o[i].title];
			if (s) {
				o[i].title = s;
			}
			var s = Lang[o[i].alt];
			if (s) {
				o[i].alt = s;
			}
		}
	}
	var o = doc.getElementsByTagName("button");
	if (o) {
		for (i = 0; i < o.length; i++) {
			var s = Lang[o[i].innerHTML.replace(/&amp;/ig, "&")];
			if (!s) {
				s = o[i].innerHTML;
			}
			o[i].innerHTML = amp2ul(s);
			var s = Lang[o[i].title];
			if (s) {
				o[i].title = s;
			}
			var s = Lang[o[i].alt];
			if (s) {
				o[i].alt = s;
			}
		}
	}
}

function amp2ul(s)
{
	s = s.replace(/&amp;/ig, "&");
	if (s.match(";")) {
		return s;
	}
	else {
		return s.replace(/&(.)/ig, "<u>$1</u>");
	}
}

GetText = function (id)
{
	try {
		id = id.replace(/&amp;/g, "&");
		var s = te.Data.Lang[id];
		if (s) {
			return s;
		}
	} catch (e) {}
	return id;
}

AddEventEx = function (w, Name, fn)
{
	if (w.addEventListener) {
		w.addEventListener(Name, fn, false);
	}
	else if (w.attachEvent){
		w.attachEvent("on" + Name, fn);
	}
}

FindText = function (s)
{
	if (s) {
		var bFound = true;
		var rng = document.body.createTextRange();

		while (bFound) {
			for (var i = 0; i <= g_nFind && (bFound = rng.findText(s)) != false; i++) {
				rng.moveStart("character", 1);
				rng.moveEnd("textedit");
			}
			if (bFound) {
				rng.moveStart("character", -1);
				rng.findText(s);
				try {
					rng.select();
					bFound = false;
				} catch (e) {}
				rng.scrollIntoView();
				g_nFind++;
			}
			else {
				g_nFind = 0;
			}
		}
	}
}

FindKeyEvent = function (o)
{
	if (event.keyCode == 13) {
		FindText(o.value);
		return false;
	}
	g_nFind = 0;
}
