SetTabContents(0, "", '<input type="button" value="Load" onclick="Addons.LabelSQLiteOdbc.Import()"><br><input type="button" value="Save" onclick="Addons.LabelSQLiteOdbc.Export()"><br><br><input type="button" value="' + api.sprintf(999, GetText("Get %s..."), "SQLite ODBC Driver") + '" title="http://www.ch-werner.de/sqliteodbc/" onclick="wsh.Run(this.title)">');

Addons.LabelSQLiteOdbc.Import = function ()
{
    var commdlg = api.CreateObject("CommonDialog");
    commdlg.InitDir = fso.BuildPath(te.Data.DataFolder, "config")
    commdlg.Filter = MakeCommDlgFilter("*.tsv");
    commdlg.Flags = OFN_FILEMUSTEXIST;
    if (commdlg.ShowOpen()) {
        (MainWindow.Addons.LabelSQLiteOdbc || Addons.LabelSQLiteOdbc).Load(commdlg.FileName);
    }
}

Addons.LabelSQLiteOdbc.Export = function ()
{
    var commdlg = api.CreateObject("CommonDialog");
    commdlg.InitDir = fso.BuildPath(te.Data.DataFolder, "config")
    commdlg.Filter = MakeCommDlgFilter(".tsv");
    commdlg.DefExt = "tsv";
    commdlg.Flags = OFN_OVERWRITEPROMPT;
    if (commdlg.ShowSave()) {
        (MainWindow.Addons.LabelSQLiteOdbc || Addons.LabelSQLiteOdbc).Save(commdlg.FileName);
    }
    return;
}
