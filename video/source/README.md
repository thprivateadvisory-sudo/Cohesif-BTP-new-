# Vidéo promotionnelle Cohesif BTP (46 s, 1920×1080, 30 i/s)

Vidéo `../cohesif-btp-promo.mp4` réalisée entièrement en code (aucun modèle génératif ni template) :
animation HTML/SVG rendue image par image avec Playwright, musique synthétisée en Python (numpy), montage ffmpeg.

- `film.src.html` — l'animation (fonction `seek(t)`, 8 scènes). Textes, prix et chiffres modifiables directement.
- `logo.json` — logo Cohesif BTP vectorisé depuis `logo.png` (`trace.py`, potracer).
- `music.py` — bande-son (120 BPM, la mineur) calée sur les scènes → `music.wav`.
- `build.py` / `render.js` — assemblage puis rendu des images.

Refaire la vidéo (dans un dossier de travail contenant `v/`, avec `v/a/` = images produits/certifications de `img/`
et `v/f/` = images de `img/boutique/isolation/laine-de-roche-usine.mp4` extraites avec ffmpeg) :

    python3 build.py && mkdir frames && node render.js 0 1 && python3 music.py
    ffmpeg -framerate 30 -i frames/%05d.png -i music.wav -c:v libx264 -b:v 5M -pix_fmt yuv420p \
      -c:a aac -af loudnorm=I=-14 -shortest cohesif-btp-promo.mp4
