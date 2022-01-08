urlAddons = "https://tablacus.github.io/TablacusExplorerAddons/";
urlIcons = urlAddons + "te/iconpacks/";

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
				setTimeout(IconPacksList, 99, xhr);
			}
		}
	}
	xhr.open("GET", urlIcons + "index.json?" + Math.floor(new Date().getTime() / 60000));
	xhr.setRequestHeader('Pragma', 'no-cache');
	xhr.setRequestHeader('Cache-Control', 'no-store');
	xhr.setRequestHeader('Expires', '0');
	try {
		xhr.send(null);
	} catch (e) {}
});

function IconPacksList(xhr) {
	if (xhr) {
		g_xhrIcons = xhr;
	} else {
		xhr = window.g_xhrIcons;
	}
	if (!xhr) {
		return;
	}
	const json = JSON.parse(xhr.responseText);
	const td = [];
	let Installed = "";
	for (let n in json) {
		if (n != Installed) {
			let s1;
			const s = [];
			info = json[n].info;
			if (IconPacksList1(s, n, info)) {
				if (g_nSort["1_3"] == 0) {
					s1 = info.name[Lang] || info.name.en;
				} else if (g_nSort["1_3"] == 1) {
					if (json.pubDate) {
						s1 = ("0000000" + (99999999 - Math.floor(new Date(json.pubDate).getTime() / 86400000))).slice(-8);
					}
				} else {
					s1 = n;
				}
				td.push([s1 + "\t" + n, s.join("")]);
			}
		}
	}
	td.sort();
	SetTable(document.getElementById("IconPacks1"), td);
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
