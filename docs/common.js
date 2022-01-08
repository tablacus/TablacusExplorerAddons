var fso = null;
var Lang = (navigator.userLanguage || navigator.language || navigator.browserLanguage || "en").toLowerCase();
if (Lang != "zh-cn") {
	Lang = Lang.replace(/\-.*/,"");
}
var ui_ = {};
var g_nSort = 0;

te = {
	Data: {
		Conf_Lang: Lang,
		Lang: {}
	}
}
if (Lang == "de") {
	te.Data.Lang = {
		Download: "Herunterladen",
		Search: "Suche",
		Filter: "Filter",
		Details: "Details",
		Up: "Hoch",
	};
} else if (Lang == "es") {
	te.Data.Lang = {
		Download: "Descargar",
		Search: "Buscar",
		Filter: "Filtro",
		Details: "Detailles",
		Up: "Arriba",
	};
} else if (Lang == "fr") {
	te.Data.Lang = {
		Download: "Télécharger",
		Search: "Rechercher",
		Filter: "Filtre",
		Details: "Détails",
		Up: "Monter",
	};
} else if (Lang == "it") {
	te.Data.Lang = {
		Download: "Scaricare",
		Search: "Ricerca",
		Filter: "Filtro",
		Details: "Dettagli",
		Up: "Su",
	};
} else if (Lang == "ja") {
	te.Data.Lang = {
		Download: "ダウンロード",
		Search: "検索",
		Filter: "フィルタ",
		Details: "詳細",
		Up: "上へ",
	};
} else if (Lang == "pt") {
	te.Data.Lang = {
		Download: "Baixar",
		Search: "Pesquisar",
		Filter: "Filtrar",
		Details: "Detalhes",
		Up: "Acima",
	};
} else if (Lang == "ru") {
	te.Data.Lang = {
		Download: "Скачать",
		Search: "Поиск",
		Filter: "Фильтр",
		Details: "Таблица",
		Up: "Вверх",
	};
} else if (Lang == "tr") {
	te.Data.Lang = {
		Download: "İndir",
		Search: "Ara",
		Filter: "Filtre",
		Details: "Detaylar",
		Up: "Üst",
	};
} else if (Lang == "zh") {
	te.Data.Lang = {
		Download: "下載",
		Search: "搜尋",
		Filter: "篩選",
		Details: "詳細資料",
		Up: "上移",
	};
} else if (Lang == "zh-cn") {
	te.Data.Lang = {
		Download: "下载",
		Search: "搜索",
		Filter: "过滤",
		Details: "详细信息",
		Up: "上一个",
	};
}

function createHttpRequest()
{
	if (window.XMLHttpRequest) {
		return new XMLHttpRequest();
	} else if (window.ActiveXObject) {
		try {
			return new ActiveXObject("Msxml2.XMLHTTP");
		} catch(e) {
			return new ActiveXObject("Microsoft.XMLHTTP");
		}
	} else {
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
	} else {
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
	} else if (w.attachEvent){
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
			} else {
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

function SetTable(table, td) {
	if (table) {
		while (table.rows.length > 0) {
			table.deleteRow(0);
		}
		for (let i = 0; i < td.length; ++i) {
			const tr = table.insertRow(i);
			const td1 = tr.insertCell(0);
			td[i].shift();
			td1.innerHTML = td[i].join("");
			ApplyLang(td1);
		}
	}
}
