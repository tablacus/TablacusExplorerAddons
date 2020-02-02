del fldrimg.ncb
attrib -h fldrimg.suo
del fldrimg.suo
del /q fldrimg\fldrimg.vcproj.*.user
del /q Debug\fldrimg*.*
del /q fldrimg\Debug\*
rmdir fldrimg\Debug
del /q Release\*
rmdir Release
del /q fldrimg\Release\*
rmdir fldrimg\Release
del /q /s x64\Release\*
rmdir x64\Release
del /q /s x64\Debug\*
rmdir x64\Debug
rmdir x64
del /q /s fldrimg\x64\*
rmdir fldrimg\x64\Release
rmdir fldrimg\x64\Debug
rmdir fldrimg\x64
del /q /s *.sdf
rmdir /q /s ipch
rmdir /q /s .vs
rmdir /q /s Debug
