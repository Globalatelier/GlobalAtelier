# Global Atelier

Produktkatalog für Streetwear und Luxury. Besucher legen Artikel in den Warenkorb und senden die Anfrage über WhatsApp. Es gibt keine Online-Zahlung und kein Kundenkonto.

## Setup

1. Repository auf Vercel verbinden und die Variablen aus `.env.example` setzen. Lokal dieselbe Datei als `.env.local` anlegen.
2. In Supabase ein Projekt anlegen.
3. `supabase/schema.sql` im SQL Editor ausführen. Bei einem bestehenden Projekt dieselbe Datei erneut ausführen, damit Originalpreis und Herstellerlink ergänzt werden.
4. Unter Authentication die öffentliche Registrierung deaktivieren.
5. Einen Admin-Benutzer anlegen und **Auto Confirm** aktivieren, damit die Anmeldung sofort funktioniert.
6. Bei Cloudinary Cloud Name, API Key und API Secret eintragen.
7. `npm install` und `npm run dev`.

Der Shop ist danach unter `/` erreichbar, der Admin unter `/admin`.

`SUPABASE_SERVICE_ROLE_KEY` wird von der App nicht verwendet. Nicht als `NEXT_PUBLIC_` Variable setzen.

## Artikelnummern

Die Nummer entsteht beim Anlegen in der Datenbank und bleibt beim Bearbeiten gleich.

- Ein Wort: die ersten drei Buchstaben, dann eine fortlaufende Zahl. `Balenciaga` wird `BAL1`.
- Mehrere Wörter: die ersten zwei Buchstaben des ersten Wortes plus der erste Buchstabe des zweiten Wortes. `Moncler Jacke` wird `MOJ1`, das nächste Produkt mit demselben Kürzel `MOJ2`.

## Preise

Jedes Produkt hat einen Originalpreis und den Shop-Preis. Liegt der Originalpreis darüber, wird er durchgestrichen angezeigt. Ein Herstellerlink öffnet den Shop des Herstellers.

## Import

Unter `/admin/products/import` lassen sich Produkte als CSV anlegen. Die Vorlage nutzt dieselben Felder wie das Produktformular. Die Artikelnummer kommt weiterhin aus der Datenbank.

## Bilder

Uploads laufen signiert über `/api/upload`. Das Cloudinary-Secret bleibt auf dem Server. Das erste Bild ist das Hauptbild.

## Deployment

Next.js auf Vercel deployen. Dieselben Env-Variablen im Projekt hinterlegen. Nach dem Deploy kann der Kunde Produkte direkt im Admin pflegen.
