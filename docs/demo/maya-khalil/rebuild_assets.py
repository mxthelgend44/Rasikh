"""Rebuild the fictional PDF, document PNGs and distributable ZIP bundle."""
from pathlib import Path
import json
import shutil
import subprocess
import sys
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parent


def main():
    renderer = shutil.which('pdftoppm')
    if renderer is None:
        raise SystemExit('Install Poppler (pdftoppm) before rebuilding the demo assets.')
    subprocess.run([sys.executable, str(ROOT / 'build_demo_pack.py')], check=True)
    manifest = json.loads((ROOT / 'document-manifest.json').read_text(encoding='utf-8'))
    with tempfile.TemporaryDirectory(prefix='rasikh-maya-render-') as folder:
        prefix = Path(folder) / 'page'
        result = subprocess.run(
            [renderer, '-f', '3', '-l', '9', '-r', '120', '-png',
             str(ROOT / 'output/pdf/maya-khalil-demo-pack.pdf'), str(prefix)],
            capture_output=True, text=True,
        )
        if result.returncode:
            raise SystemExit('PDF rendering failed:\n' + result.stderr[-4000:])
        for document in manifest['documents']:
            source = Path(folder) / f'page-{document["pdf_page"]}.png'
            shutil.copyfile(source, ROOT / document['png'])
    files = [
        ROOT / 'README.md', ROOT / 'START-HERE.txt', ROOT / 'character.json',
        ROOT / 'document-manifest.json', ROOT / 'build_demo_pack.py',
        ROOT / 'rebuild_assets.py', ROOT / 'requirements.txt',
        ROOT / 'output/pdf/maya-khalil-demo-pack.pdf',
        *sorted((ROOT / 'documents').glob('*.png')),
        *sorted((ROOT / 'documents').glob('*.txt')),
    ]
    with zipfile.ZipFile(ROOT / 'maya-khalil-demo-bundle.zip', 'w', zipfile.ZIP_DEFLATED) as bundle:
        for file in files:
            bundle.write(file, 'maya-khalil-demo-pack/' + file.relative_to(ROOT).as_posix())
    print(f'Rebuilt 9-page fictional PDF, 7 document PNGs, and bundle ({len(files)} files).')


if __name__ == '__main__':
    main()
