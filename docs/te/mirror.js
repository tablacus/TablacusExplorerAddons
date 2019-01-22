// Tablacus Explorer download mirror
var res;
var json_file = "./releases.json";
var cmd = 'powershell [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri "%url%" -OutFile "%file%"';
var wsh = new ActiveXObject('WScript.Shell');
wsh.Run("cmd /cdel *.zip", 1, true);
wsh.Run(cmd.replace(/%url%/ig, "https://api.github.com/repos/tablacus/TablacusExplorer/releases/latest").replace(/%file%/ig, json_file), 1, true);

var ado = new ActiveXObject("ADODB.Stream");
ado.CharSet = "utf-8";
ado.Open();
ado.LoadFromFile(json_file);
var res = /"browser_download_url":"([^"]*?)([^\/"]*)"/i.exec(ado.ReadText(-1));
ado.Close();

wsh.Run(cmd.replace(/%url%/ig, res[1] + res[2]).replace(/%file%/ig, "./" + res[2]), 1, true);

var fso = new ActiveXObject("Scripting.FileSystemObject");
fso.CopyFile(res[2], "te.zip");
