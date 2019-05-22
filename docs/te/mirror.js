// Tablacus Explorer download mirror
var res;
var json_file = "./releases.json";
var en_file = "../../../tablacus.github.io/explorer_en.html";
var ja_file = "../../../tablacus.github.io/explorer.html";

var cmd = 'powershell [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri "%url%" -OutFile "%file%"';
var wsh = new ActiveXObject('WScript.Shell');
wsh.Run("cmd /cdel *.zip", 1, true);
wsh.Run(cmd.replace(/%url%/ig, "https://api.github.com/repos/tablacus/TablacusExplorer/releases/latest").replace(/%file%/ig, json_file), 1, true);

var ado = new ActiveXObject("ADODB.Stream");
ado.CharSet = "utf-8";
ado.Open();
ado.LoadFromFile(json_file);
var s = ado.ReadText(-1);
var res = /"browser_download_url":"([^"]*?)([^\/"]*)"/i.exec(s);
var filename = res[2];
var browser_download_url = res[1] + res[2];
res = /"tag_name":"([^"]*?)"/i.exec(s);
var tag_name = res[1];
res = /"size":(\d+)/i.exec(s);
var size = (res[1] / 1024).toFixed(1) + "KB";
res = /"published_at":"([^"]*?)"/i.exec(s);
var published_at = res[1];
res = /^(\d+)-(\d+)-(\d+)/.exec(published_at);
var year = res[1], mon = res[2] - 0 , day = res[3] - 0;
var published_ja = year + decodeURI("%E5%B9%B4") + mon + decodeURI("%E6%9C%88") + day + decodeURI("%E6%97%A5");
var published_en = new Date(Date.UTC(year, mon - 1, day)).toUTCString().replace(/\s+\d\d:00:00.*$/, "");
res = /\((https:[^\)]+)/.exec(s);
var virustotal = res[1];
ado.Close();

wsh.Run(cmd.replace(/%url%/ig, browser_download_url).replace(/%file%/ig, "./" + filename), 1, true);
var fso = new ActiveXObject("Scripting.FileSystemObject");
fso.CopyFile(filename, "te.zip");

ado = new ActiveXObject("ADODB.Stream");
ado.CharSet = "utf-8";
ado.Open();
ado.LoadFromFile(en_file);
s = ado.ReadText(-1);
ado.Close();

s = s.replace(/(<span id="ver">)[^<]*/i, "$1" + tag_name);
s = s.replace(/(<span id="size">)[^<]*/i, "$1" + size);
s = s.replace(/(href=")[^"]*(" id="dl")/i, "$1" + browser_download_url + "$2");
s = s.replace(/(href=")[^"]*(" id="virustotal")/i, "$1" + virustotal + "$2");
s = s.replace(/(<span id="date">)[^<]*/i, "$1" + published_en);

ado = new ActiveXObject("ADODB.Stream");
ado.CharSet = "utf-8";
ado.Open();
ado.WriteText(s);
ado.SaveToFile(en_file, 2);
ado.Close();

ado = new ActiveXObject("ADODB.Stream");
ado.CharSet = "utf-8";
ado.Open();
ado.LoadFromFile(ja_file);
s = ado.ReadText(-1);
ado.Close();

s = s.replace(/(<span id="ver">)[^<]*/i, "$1" + tag_name);
s = s.replace(/(<span id="size">)[^<]*/i, "$1" + size);
s = s.replace(/(href=")[^"]*(" id="dl")/i, "$1" + browser_download_url + "$2");
s = s.replace(/(href=")[^"]*(" id="virustotal")/i, "$1" + virustotal + "$2");
s = s.replace(/(<span id="date">)[^<]*/i, "$1" + published_ja);

ado = new ActiveXObject("ADODB.Stream");
ado.CharSet = "utf-8";
ado.Open();
ado.WriteText(s);
ado.SaveToFile(ja_file, 2);
ado.Close();
