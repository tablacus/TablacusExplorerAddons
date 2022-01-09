nCount = 0;
returnValue = false;
xhr = null;
xmlAddons = null;
g_tid = null;

function CheckAddon(Id)
{
	return fso.FileExists(fso.BuildPath(fso.GetParentFolderName(api.GetModuleFileName(null)), "addons\\" + Id + "\\config.xml"));
}

function AddonsSearch()
{
	clearTimeout(g_tid);
	if (nCount != xmlAddons.length) {
		AddonsList();
		return true;
	}
	var q =
	{
		td: [],
		ts: [],
		i: 0
	}
	if (AddonsSub(q)) {
		document.F.b.disabled = true;
		document.body.style.cursor = "wait";
		AddonsAppend(q)
	}
	return true;
}

function AddonsSub(q)
{
	if (document.getElementById) {
		var table = document.getElementById("addons");
		if (table) {
			while (table.rows.length > 0) {
				table.deleteRow(0);
			}
			for (var i = 0; i < xmlAddons.length; i++) {
				var Id = xmlAddons[i].getAttribute("Id");
				var tr = table.insertRow(i);
				q.td[i] = tr.insertCell(0);
			}
			q.ts = new Array(xmlAddons.length);
			nCount = 0;
			return true;
		}
	}
	return false;
}

function AddonsList()
{
	clearTimeout(g_tid);
	nCount = 0;
	var q =
	{
		td: [],
		ts: [],
		i: 0
	}

	xmlAddons = xhr.responseXML.getElementsByTagName("Item");
	if (AddonsSub(q)) {
		document.F.b.disabled = true;
		document.body.style.cursor = "wait";
		AddonsAppend(q)
	}
}

function AddonsAppend(q)
{
	if (xmlAddons[q.i]) {
		ArrangeAddon(xmlAddons[q.i], xmlAddons[q.i].getAttribute("Id"), q.td, q.ts);
		q.i++
		g_tid = setTimeout(function () {
			AddonsAppend(q);
		}, 1);
	} else {
		document.F.b.disabled = false;
		document.body.style.cursor = "auto";
	}
}

function ArrangeAddon(xml, Id, td, ts)
{
	var s = [];
	if (Search(xml)) {
		var info = new Array();
		GetAddonInfo2(xml, info, "General");
		GetAddonInfo2(xml, info, "en");
		GetAddonInfo2(xml, info, te.Data.Conf_Lang);

		var pubDate = "";
		var dt = new Date(info.pubDate);
		if (info.pubDate) {
			pubDate = dt.toLocaleDateString() + " ";
		}
		s.push('<b>' + info.Name + "</b>&nbsp;" + info.Version + "&nbsp;" + info.Creator + "<br>" + info.Description + "<br>");
		if (info.Details) {
			s.push('<a href="' + info.Details + '" target="_blank">' + GetText("Details") + '</a>');			
		}
		s.push('<div>' + pubDate + '</div><div style="pull-right">');
		var filename = info.filename;
		if (!filename) {
			filename = Id + '_' + info.Version.replace(/\D/, '') + '.zip';
		}
		var dt2 = (dt.getTime() / (24 * 60 * 60 * 1000)) - info.Version;
		s.push('<a href="' + Id + '/' + filename + '" class="btn btn-primary">' + 'Download' + '</a>');
		s.push('</div>');
		var nInsert = 0;
		while (nInsert <= nCount && dt2 < ts[nInsert]) {
			nInsert++;
		}
		for (j = nCount; j > nInsert; j--) {
			td[j].innerHTML = td[j - 1].innerHTML;
			td[j].className = (j & 1) ? "oddline" : "";
			ts[j] = ts[j - 1];
		}
		td[nInsert].className = (nInsert & 1) ? "oddline" : "";
		td[nInsert].innerHTML = s.join("");
		ApplyLang(td[nInsert]);
		ts[nInsert] = dt2;
		nCount++;
	}
}

function GetAddonInfo2(xml, info, Tag)
{
	var items = xml.getElementsByTagName(Tag);
	if (items.length) {
		var item = items[0].childNodes;
		for (var i = 0; i < item.length; i++) {
			if (item[i].tagName) {
				if (item[i].textContent) {
					info[item[i].tagName] = item[i].textContent;
				} else {
					info[item[i].tagName] = item[i].text;
				}
			}
		}
	}
	return info;
}

function Search(xml)
{
	var q =  document.F.q.value.toUpperCase();
	if (q == "") {
		return true;
	}
	var Tags = ["General", "en", "fr", "ja", "zh"];

	for (var k = 0; k < Tags.length; k++) {
		var items = xml.getElementsByTagName(Tags[k]);
		if (items.length) {
			var item = items[0].childNodes;
			for (var i = 0; i < item.length; i++) {
				if (item[i].tagName) {
					var s = '';
					if (item[i].textContent) {
						s = item[i].textContent + "";
					} else {
						s = item[i].text + "";
					}
					if (s.toUpperCase().match(q)) {
						return true;
					}
				}
			}
		}
	}
	return false;
}

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
				setTimeout(AddonsList, 99);
			}
		}
	}
	xhr.open("GET", location.href.replace(/[^\/]*$/, "") + "index.xml?" + Math.floor(new Date().getTime() / 60000));
	xhr.setRequestHeader('Pragma', 'no-cache');
	xhr.setRequestHeader('Cache-Control', 'no-store');
	xhr.setRequestHeader('Expires', '0');
	try {
		xhr.send(null);
	} catch (e) {}
});
