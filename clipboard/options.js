returnValue = false;

function InitOptions()
{
	ApplyLang(document);

	info = GetAddonInfo(Addon_Id);
	document.title = info.Name;
	var items = te.Data.Addons.getElementsByTagName(Addon_Id);
	if (items.length) {
		var Location = items[0].getAttribute("Location");
		if (!Location) {
			Location = Default;
		}
		for (var i = document.F.elements.length - 1; i >= 0; i--) {
			if (Location == document.F.elements[i].value) {
				document.F.elements[i].checked = true;
			}
		}
	}
	var locs = new Array();
	items = te.Data.Locations;
	for (var i in items) {
		var a = items[i].split("\t");
		info = GetAddonInfo(a[1]);
		var s = info.Name;
		if (locs[a[0]]) {
			locs[a[0]] += ', ' + s;
		}
		else {
			locs[a[0]] = s;
		}
	}
	for (var i in locs) {
		document.getElementById('_' + i).innerHTML = '<input type="text" value="' + locs[i].replace('"', "") + '" style="width: 85%">';
	}
}

function SetOptions()
{
	var items = te.Data.Addons.getElementsByTagName(Addon_Id);
	if (items.length) {
		var item = items[0];
		Location = Default;
		for (var i = document.F.elements.length - 1; i >= 0; i--) {
			if (document.F.elements[i].checked) {
				Location = document.F.elements[i].value;
			}
		}
		item.setAttribute("Location", Location);
		returnValue = true;
	}
	window.close();
}
