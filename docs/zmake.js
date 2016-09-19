CreateXml = function ()
{
	var xml = new ActiveXObject("Msxml2.DOMDocument");
	xml.async = false;
	xml.appendChild(xml.createProcessingInstruction("xml", 'version="1.0" encoding="UTF-8"'));
	return xml;
}

// ファイル関連の操作を提供するオブジェクトを取得
var fso = new ActiveXObject("Scripting.FileSystemObject");

//  Folderオブジェクトを取得
var folder = fso.GetFolder(".");

//  EnumeratorオブジェクトにFolderオブジェクトに
//  含まれている全てのFileオブジェクトを格納
var em = new Enumerator( folder.SubFolders );
var Tags = ["General", "en", "ja"];
var xmlSave = CreateXml();
var root = xmlSave.createElement("TablacusExplorer");

//  格納したFileオブジェクトのファイル名を全て表示
for( em.moveFirst(); !em.atEnd(); em.moveNext() ) {
	var name = em.item().Name;
	var xml = new ActiveXObject("Msxml2.DOMDocument");
	xml.async = false;
	if (xml.load(name + "\\config.xml")) {
		var item1 = xmlSave.createElement("Item");
		item1.setAttribute("Id", name);
		for (var k = 0; k < Tags.length; k++) {
			var items = xml.getElementsByTagName(Tags[k]);
			if (items.length) {
				var item2 = xmlSave.createElement(Tags[k]);
				var item = items[0].childNodes;
				for (var i = 0; i < item.length; i++) {
					if (item[i].tagName && item[i].tagName != "Options") {
						var item3 = xmlSave.createElement(item[i].tagName);
						item3.text = item[i].text;
						item2.appendChild(item3);
					}
				}
				item1.appendChild(item2);
			}
		}
		root.appendChild(item1);
	}
}
xmlSave.appendChild(root);
xmlSave.save("index.xml");
