urlAddons = "https://tablacus.github.io/TablacusExplorerAddons/";
urlLang = urlAddons + "te/lang/";

AddEventEx(window, "load", function ()
{
	ApplyLang(document);
	if (location.search.match(/q=(.*)/)) {
		document.F.q.value = decodeURI(RegExp.$1);
	}
	xhr = createHttpRequest();
	xhr.onreadystatechange = function()
	{
		if (xhr.readyState == 4) {
			if (xhr.status == 200) {
				setTimeout(LangPacksList, 99, xhr);
			}
		}
	}
	xhr.open("GET", urlLang + "index.json?" + Math.floor(new Date().getTime() / 60000));
	xhr.setRequestHeader('Pragma', 'no-cache');
	xhr.setRequestHeader('Cache-Control', 'no-store');
	xhr.setRequestHeader('Expires', '0');
	try {
		xhr.send(null);
	} catch (e) {}
});

function LangPacksList(xhr) {
	if (xhr) {
		g_xhrLang = xhr;
	} else {
		xhr = window.g_xhrLang;
	}
	if (!xhr) {
		return;
	}
	const text = xhr.responseText;
	const json = JSON.parse(text);
	const td = [];
	const bt = GetText("Download");
	const q = document.F.q.value.toLowerCase();
	for (let n in json) {
		const info = json[n];
		if (JsonSearch(info, q)) {
			const tm = new Date(info.pubDate).toLocaleDateString();
			const ar = [tm, '<b style="font-size: 1.3em">', info.name, " / ", info.en, "</b><br>", info.author, '<a href="', urlLang, n, '" class="btn btn-primary" style="float: right">', bt, '</a><br>', tm];
			td.push(ar);
		}
	}
	SetTable(document.getElementById("LangPacks1"), td);
}

function JsonSearch(info, q) {
	if (!q) {
		return true;
	}
	let s = "";
	for (let i in info) {
		s += info[i] + "\n";
	}
	return s.toLowerCase().indexOf(q) >= 0
}

function IconPacksList1(s, Id, info, json) {
	const q = document.F.q.value.toLowerCase();
	if (!json && !JsonSearch(info, q)) {
		return false;
	}
	s.push('<img src="', urlIcons, Id, '/preview.png" align="left" style="margin-right: 8px"><b style="font-size: 1.3em">', info.name[Lang] || info.name.en, '</b> ');
	s.push(info.version, " ");
	if (info.URL) {
		s.push('<a href="', info.URL, '" title="', info.URL, '" class="link">');
	}
	s.push(info.creator[Lang] || info.creator.en);
	if (info.URL) {
		s.push('</a>');
	}
	s.push("<br>", info.descprition[Lang] || info.descprition.en, "<br>");
	if (!ui_.strInstall) {
		ui_.strInstall = GetText("Download");
	}
	s.push('<a href="./te/iconpacks/', Id, '/', Id, "_", info.version.replace(/\./, ""), '.zip" class="btn btn-primary" style="float: right;">', ui_.strInstall, '</a>');
	s.push("<br>", new Date(info.pubDate).toLocaleString());
	return true;
}
