"""Point siflo.app (apex + www) at GitHub Pages in the OVH zone.

Removes OVH's placeholders (apex A on its web servers, apex -> www redirect, "site en construction" page),
points www at paulasquin.github.io. and adds the GitHub Pages A/AAAA records on the apex.
MX, SPF and ftp are left untouched. Idempotent.

    bws-env run ovh -- uv run -q --with ovh python -I tools/ovh_dns.py
"""
import os

import ovh

c = ovh.Client(endpoint=os.environ["OVH_ENDPOINT"], application_key=os.environ["OVH_APPLICATION_KEY"],
               application_secret=os.environ["OVH_APPLICATION_SECRET"], consumer_key=os.environ["OVH_CONSUMER_KEY"])
z = "siflo.app"
A = ["185.199.108.153", "185.199.109.153", "185.199.110.153", "185.199.111.153"]
AAAA = ["2606:50c0:8000::153", "2606:50c0:8001::153", "2606:50c0:8002::153", "2606:50c0:8003::153"]
recs = {rid: c.get(f"/domain/zone/{z}/record/{rid}") for rid in c.get(f"/domain/zone/{z}/record")}

for rid, r in recs.items():
    t = r["target"].strip('"')
    if (r["subDomain"] in ("", "www") and r["fieldType"] in ("A", "AAAA") and t not in A + AAAA) or \
            (r["fieldType"] == "TXT" and t in ("1|www.siflo.app", "3|welcome", "l|fr")):
        c.delete(f"/domain/zone/{z}/record/{rid}")
        print("deleted", r["subDomain"] or "@", r["fieldType"], t)

have = {(r["subDomain"], r["fieldType"], r["target"]) for r in recs.values()}
for kind, ips in (("A", A), ("AAAA", AAAA)):
    for ip in ips:
        if ("", kind, ip) not in have:
            c.post(f"/domain/zone/{z}/record", fieldType=kind, subDomain="", target=ip, ttl=3600)
            print(kind, ip)
if ("www", "CNAME", "paulasquin.github.io.") not in have:
    c.post(f"/domain/zone/{z}/record", fieldType="CNAME", subDomain="www", target="paulasquin.github.io.", ttl=3600)
    print("www CNAME -> paulasquin.github.io.")

c.post(f"/domain/zone/{z}/refresh")
print("zone refreshed")
