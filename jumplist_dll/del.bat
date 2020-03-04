del jumplist.ncb
attrib -h jumplist.suo
del jumplist.suo
del /q jumplist\jumplist.vcproj.*.user
del /q Debug\jumplist*.*
del /q jumplist\Debug\*
rmdir jumplist\Debug
del /q Release\*
rmdir Release
del /q jumplist\Release\*
rmdir jumplist\Release
del /q /s x64\Release\*
rmdir x64\Release
del /q /s x64\Debug\*
rmdir x64\Debug
rmdir x64
del /q /s jumplist\x64\*
rmdir jumplist\x64\Release
rmdir jumplist\x64\Debug
rmdir jumplist\x64
del /q /s *.sdf
rmdir /q /s ipch
