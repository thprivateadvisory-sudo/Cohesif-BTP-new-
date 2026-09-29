#!/usr/bin/env python3
"""Crée les liens de paiement Stripe des acomptes (mini-pelles et chariots) et les branche sur le site.

    STRIPE_API_KEY=rk_live_... python3 tools/stripe_acomptes.py

Pour chaque machine active avec un prix et sans "stripeAcompte" : crée un produit, un prix
(acompte TTC calculé comme sur le site) et un lien de paiement Stripe, puis
enregistre le lien dans data/boutique.json et régénère la boutique.
Relancer le script ne recrée pas les liens déjà enregistrés. Si un prix change,
remettre "stripeAcompte" à null puis relancer (et désactiver l'ancien lien dans Stripe).

Clé conseillée : clé restreinte Stripe avec les droits en écriture sur
Products, Prices et Payment Links (jamais la clé secrète sk_ complète dans le dépôt).
"""
import json
import os
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = ROOT / "data" / "boutique.json"
API = "https://api.stripe.com/v1/"
CGV = "https://cohesifbtp.fr/cgv.html#vente-materiel"


def stripe(path, params):
    key = os.environ.get("STRIPE_API_KEY")
    if not key:
        sys.exit("STRIPE_API_KEY manquante : ajoutez-la dans les variables d'environnement.")
    req = urllib.request.Request(API + path, data=urllib.parse.urlencode(params).encode(),
                                 headers={"Authorization": f"Bearer {key}"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        raise RuntimeError(json.load(e).get("error", {}).get("message", str(e))) from None


def lien_acompte(p, montant_centimes):
    ref = p["ref"]
    produit = stripe("products", {"name": f"Acompte 30 % — {p['nom']} {ref}",
                                  "description": "Acompte de réservation. Solde et livraison réglés par virement avant expédition.",
                                  "images[0]": f"https://cohesifbtp.fr/img/boutique/stripe/{ref.lower()}.jpg",
                                  "metadata[marque]": "Cohesif BTP", "metadata[ref]": ref})
    prix = stripe("prices", {"product": produit["id"], "currency": "eur",
                             "unit_amount": montant_centimes, "metadata[cohesif_ref]": ref})
    base = {"line_items[0][price]": prix["id"], "line_items[0][quantity]": 1,
            "phone_number_collection[enabled]": "true",
            "billing_address_collection": "required",
            "tax_id_collection[enabled]": "true",
            "metadata[cohesif_ref]": ref,
            "custom_text[submit][message]": f"Acompte de réservation : {p['nom']}. "
                                            f"Conditions : {CGV}"}
    try:
        # case « J'accepte les conditions » : exige l'URL des CGV dans les réglages publics Stripe
        return stripe("payment_links", {**base, "consent_collection[terms_of_service]": "required"})
    except RuntimeError as e:
        print(f"  (case CGV non activée : {e})")
        return stripe("payment_links", base)


def main():
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    resa = data["reservation"]
    crees = 0
    for p in data["produits"]:
        if not p.get("actif", True) or not p.get("prix") or p.get("stripeAcompte"):
            continue
        centimes = round(p["prix"] * resa["acomptePct"] / 100 * (1 + resa["tva"] / 100) * 100)
        print(f"{p['ref']} : acompte {centimes / 100:.2f} € TTC…")
        lien = lien_acompte(p, centimes)
        p["stripeAcompte"] = lien["url"]
        print(f"  → {lien['url']}")
        crees += 1
        # enregistrement après chaque lien : pas de doublon si le script s'arrête en route
        DATA_PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    if not crees:
        print("Aucun lien à créer : toutes les machines en vente ont déjà leur lien d'acompte.")
        return
    subprocess.run([sys.executable, str(ROOT / "tools" / "build_boutique.py")], check=True)


if __name__ == "__main__":
    main()
