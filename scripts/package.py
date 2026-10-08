"""Create a deterministic production archive without third-party packaging tools."""
from pathlib import Path
import json,re,hashlib,zipfile
root=Path(__file__).resolve().parent.parent
build=root/'apps/extension/.output/chrome-mv3'
manifest=json.loads((build/'manifest.json').read_text())
assert manifest['manifest_version']==3
assert sorted(manifest['permissions'])==['activeTab','scripting','storage']
assert not any(manifest.get(key) for key in ['host_permissions','optional_host_permissions','content_scripts','externally_connectable','web_accessible_resources','optional_permissions'])
assert manifest['background']=={'service_worker':'background.js'}
assert manifest['action']=={'default_title':'Open AccessLab'}
files={p.relative_to(build).as_posix():p.read_bytes() for p in build.rglob('*') if p.is_file()}
assert files and not any(name.endswith('.map') for name in files)
for name,data in files.items():
    if name.endswith('.js'):
        code=data.decode()
        assert '__accesslabTestActivate' not in code, 'Test activation in production'
        assert not re.search(r'\beval\s*\(|\bnew\s+Function\b|\bimport\s*\(\s*[\'\"]https?://',code), 'Dynamic/remote executable code'
    if name.endswith('.html'):
        assert not re.search(r'<script[^>]*src=[\'\"]https?://',data.decode()), 'Remote script'
for name in ['LICENSE','THIRD_PARTY_NOTICES.md']:
    files[name]=(root/name).read_bytes()
for label,path in {'axe-core-MPL-2.0.txt':'node_modules/axe-core/LICENSE','React-MIT.txt':'node_modules/react/LICENSE','ReactDOM-MIT.txt':'node_modules/react-dom/LICENSE','WXT-MIT.txt':'docs/licenses/WXT-MIT.txt','Colorspacious-MIT.txt':'docs/licenses/colorspacious-MIT.txt','axe-core-source.txt':'node_modules/axe-core/axe.js'}.items():
    files['licenses/'+label]=(root/path).read_bytes()
files['INSTALL.txt']=b'AccessLab 0.1 private engineering beta. Extract this archive, open chrome://extensions, enable Developer mode, choose Load unpacked, and select this directory. Activate on an ordinary HTTP(S) page using the toolbar action. No automatic activation or all-site access. Read the packaged docs.html and project release checklist. Axe-core source and licenses are included under licenses/.\n'
dist=root/'dist';dist.mkdir(exist_ok=True)
archive=dist/f"accesslab-{manifest['version']}-chrome.zip"
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_STORED) as out:
    for name,data in sorted(files.items()):
        info=zipfile.ZipInfo(name,(1980,1,1,0,0,0));info.create_system=3;info.external_attr=0o100644<<16;info.compress_type=zipfile.ZIP_STORED
        out.writestr(info,data)
digest=hashlib.sha256(archive.read_bytes()).hexdigest()
checksum=archive.with_suffix('.zip.sha256');checksum.write_text(f'{digest}  {archive.name}\n')
print(f'{archive}: {len(files)} files; SHA-256 {digest}')
