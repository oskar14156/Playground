#!/usr/bin/env python3
"""Download permitted CC0 Poly Haven model and all glTF dependencies.

Usage:
 python scripts/polyhaven_asset.py sofa_02 out/pbr-assets/sofa_02
Requires GitHub runner/network. Uses public documented Poly Haven API.
"""
import hashlib
import json
import pathlib
import sys
import urllib.parse
import urllib.request

slug = sys.argv[1]
dest = pathlib.Path(sys.argv[2]).resolve()
dest.mkdir(parents=True, exist_ok=True)
req = urllib.request.Request(
    f"https://api.polyhaven.com/files/{urllib.parse.quote(slug)}",
    headers={"User-Agent": "MotionShorts-PocketPuh/1.0 (CC0 film asset pipeline)"})
with urllib.request.urlopen(req, timeout=45) as stream:
    files = json.load(stream)

formats = files.get("gltf", {})
if not formats:
    raise RuntimeError(f"{slug} has no glTF format: {list(files)}")
chosen = next((r for r in ("1k", "2k", "4k") if r in formats), None)
if not chosen:
    chosen = sorted(formats)[0]
model_info = formats[chosen].get("gltf")
if not model_info or not model_info.get("url"):
    raise RuntimeError(f"Invalid glTF entry for {slug}: {formats[chosen]}")
print("Selected", slug, "resolution", chosen, "file", model_info["url"], flush=True)

downloaded = set()
def fetch_to(url, relative, info):
    if not url.startswith("https://"):
        raise ValueError("Unexpected non-HTTPS URL")
    relative = relative.replace("\\", "/").lstrip("/")
    target = (dest / relative).resolve()
    if target != dest and dest not in target.parents:
        raise ValueError("Unsafe relative dependency path: " + relative)
    if target in downloaded:
        return
    target.parent.mkdir(parents=True, exist_ok=True)
    print("Downloading", relative, flush=True)
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "MotionShorts/1.0"}), timeout=180) as r, target.open("wb") as f:
        while True:
            chunk = r.read(1024 * 1024)
            if not chunk:
                break
            f.write(chunk)
    expected = info.get("md5")
    if expected:
        actual = hashlib.md5(target.read_bytes()).hexdigest()
        if actual != expected:
            raise RuntimeError(f"MD5 failed for {relative}: {actual} != {expected}")
    downloaded.add(target)

main_name = urllib.parse.unquote(urllib.parse.urlparse(model_info["url"]).path.split("/")[-1])
fetch_to(model_info["url"], main_name, model_info)

def includes_walk(obj, hint=""):
    if isinstance(obj, dict):
        if "url" in obj:
            url = obj["url"]
            name = hint or urllib.parse.unquote(urllib.parse.urlparse(url).path.split("/")[-1])
            yield (name, obj)
        else:
            for key, val in obj.items():
                yield from includes_walk(val, key)
    elif isinstance(obj, list):
        for item in obj:
            if isinstance(item, str):
                # Include may be a URL; never infer untrusted remote content.
                if item.startswith("https://"):
                    yield (urllib.parse.urlparse(item).path.split("/")[-1], {"url": item})
            elif isinstance(item, dict):
                yield from includes_walk(item, item.get("name", ""))

for rel, data in includes_walk(model_info.get("include", {})):
    fetch_to(data["url"], rel, data)

# The glTF's own relative paths are canonical. Resolve missing images by
# basename if API include names were nested differently; never silently
# drop maps and pretend material quality is high.
gltf = dest / main_name
if gltf.suffix.lower() == ".gltf":
    content = json.loads(gltf.read_text())
    rels = []
    rels += [v.get("uri", "") for v in content.get("buffers", [])]
    rels += [v.get("uri", "") for v in content.get("images", [])]
    missing = []
    for rel in rels:
        if not rel or rel.startswith("data:"):
            continue
        path = dest / urllib.parse.unquote(rel)
        if path.is_file():
            continue
        candidates = list(dest.rglob(path.name))
        if len(candidates) == 1:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(candidates[0].read_bytes())
        else:
            missing.append(rel)
    if missing:
        raise RuntimeError(f"Incomplete PBR model; cannot render: {missing}")
manifest = {"source": f"https://polyhaven.com/a/{slug}", "license": "CC0",
            "resolution": chosen, "main": str(gltf), "files": [str(p.relative_to(dest)) for p in downloaded]}
(dest / "LICENSE_AND_ASSET.json").write_text(json.dumps(manifest, indent=2))
print("READY", json.dumps(manifest, indent=2), flush=True)
