# Farbwerk · Mein Tischplaner

Privater interaktiver Aufbewahrungsplaner für einen **180 × 90 cm Basteltisch**: zwei Vallejo-Koffer, weitere Vallejo-Flaschen und Citadel-Töpfe.

**Private Website:** https://farbwerk-tischplaner-m8q2.noisywave.chatgpt.site

Dieses Repository enthält den vollständigen Quellcode und die automatisierten Tests. Es benötigt keine externen Bibliotheken und keinen Build-Schritt. Das Repository soll privat bleiben; eine öffentliche GitHub-Pages-Veröffentlichung ist nicht eingerichtet.

## Lokal starten

Voraussetzung: Node.js ab Version 20.

1. Repository herunterladen oder klonen und im Terminal in den Projektordner wechseln.
2. `npm start` ausführen. Ein `npm install` ist nicht nötig.
3. http://127.0.0.1:8080 im Browser öffnen.

Mit `Strg+C` wird der lokale Server beendet. Die HTML-Datei bitte über den Server öffnen, da die Anwendung JavaScript-Module verwendet.

## Funktionen

- Maßstäbliche Draufsicht mit Verschieben, 5-cm-Raster und Drehen.
- Eigene Aufbewahrungselemente sowie editierbare Breite, Tiefe, Höhe und getrennte Kapazitäten für Vallejo/Citadel.
- Bestands- und Kapazitätsvergleich ohne doppeltes Zählen des Kofferinhalts.
- Hinweise auf Überschneidungen, Überstände und belegte Arbeitsfläche.
- Automatisches Speichern im Browser und Planexport/-import als JSON.
- Tastatur: Pfeile verschieben das gewählte Element, `R` dreht, `Entf` entfernt.

Die voreingestellten Elementmaße und Kapazitäten sind **Beispielwerte**, keine bestätigten Produktdaten. Stellflächen inklusive benötigter Öffnungsfläche nachmessen. Die Dachschräge wird nicht geometrisch geprüft; Höhen selbst abgleichen.

## Eigene Pläne sichern

Dein Plan liegt im lokalen Speicher des jeweiligen Browsers. Er wird nicht automatisch mit GitHub, anderen Browsern oder der privaten Website synchronisiert. Über **Plan exportieren** kannst du ihn sichern und auf einem anderen Gerät mit **Plan importieren** laden. Die Quellcodesicherung enthält den Beispielplan, nicht deine nachträglichen Browseränderungen.

## Tests

```sh
npm test
```

27 automatisierte Prüfungen decken Kapazitätsberechnung, Geometrie, Positionsänderungen, Drehen, Bearbeiten, Hinzufügen/Entfernen, Persistenz und Import/Export ab. Ereignisbehandlung wird mit einem kleinen DOM-Adapter geprüft; diese Tests ersetzen keine visuelle Browserprüfung.

## Dateien

| Pfad | Inhalt |
| --- | --- |
| `index.html` | Oberfläche |
| `style.css` | Layout und Darstellung |
| `core.mjs` | Planungsmodell und Berechnungen |
| `app.mjs` | Oberfläche und Interaktionen |
| `serve.mjs` | Lokaler Server ohne zusätzliche Pakete |
| `*.test.mjs` | Automatisierte Prüfungen |

Zum Hosting werden nur `index.html`, `style.css`, `app.mjs` und `core.mjs` benötigt. Private Zugriffsrechte werden vom jeweiligen Hostingdienst durchgesetzt, nicht durch den statischen Quellcode.
