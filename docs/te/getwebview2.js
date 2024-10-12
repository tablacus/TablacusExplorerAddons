// Tablacus Explorer WebView2 html maker
var en_file = "../../../tablacus.github.io/tewv2.html";
var ja_file = "../../../tablacus.github.io/tewv2_ja.html";
var json_file = "./webview2.json";

var wsh = new ActiveXObject('WScript.Shell');
var oExec = wsh.Exec("curl https://api.github.com/repos/tablacus/TablacusExplorerWebView2/releases/latest -o " + json_file + " -L");
oExec.StdOut.ReadAll();

var ado = new ActiveXObject("ADODB.Stream");
ado.CharSet = "utf-8";
ado.Open();
ado.LoadFromFile(json_file);
var s = ado.ReadText(-1);
ado.Close();
var ar = [];
ar.push(s);
var res = /"tag_name":\s*"(.*?)"/.exec(s);
var tag_name = res[1];
ar.push(tag_name);
res = /"size":\s*(\d+)/.exec(s);
var size = (res[1] / 1024).toFixed(1) + "KB";
ar.push(size);
res = /"published_at":\s*"([^"]*?)"/i.exec(s);
var published_at = res[1];
res = /^(\d+)-(\d+)-(\d+)/.exec(published_at);
var year = res[1], mon = res[2] - 0, day = res[3] - 0;
var published_ja = year + decodeURI("%E5%B9%B4") + mon + decodeURI("%E6%9C%88") + day + decodeURI("%E6%97%A5");
ar.push(published_ja);
var published_en = new Date(Date.UTC(year, mon - 1, day)).toUTCString().replace(/\s+\d\d:00:00.*$/, "");
ar.push(published_en);
res = /"browser_download_url":\s*"(.*?)"/.exec(s);
var browser_download_url = res[1];
ar.push(browser_download_url);
res = /\[VirusTotal\]\((.*?)\)/.exec(s);
var virustotal = res[1];
ar.push(virustotal);

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

var fn = browser_download_url.replace(/^.+\//, "");
wsh.Run("curl " + browser_download_url + " -o " + fn + " -L", 1);
WScript.Echo(fn);
